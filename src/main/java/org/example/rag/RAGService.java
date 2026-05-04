package org.example.rag;

import org.example.conversation.ConversationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RAGService {

    private static final Logger logger = LoggerFactory.getLogger(RAGService.class);

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final ConversationService conversationService;

    @Value("${app.rag.default-top-k:5}")
    private int defaultTopK;

    @Value("${app.rag.similarity-threshold:0.0}")
    private double similarityThreshold;

    @Value("${app.rag.rerank-top-k:3}")
    private int rerankTopK;

    public RAGService(ChatClient chatClient, VectorStore vectorStore, ConversationService conversationService) {
        this.chatClient = chatClient;
        this.vectorStore = vectorStore;
        this.conversationService = conversationService;
    }

    public Flux<String> query(String conversationId, String userMessage) {
        List<ConversationService.MessageDto> history = conversationService.getMessages(conversationId);

        SearchRequest searchRequest = SearchRequest.builder()
                .query(userMessage)
                .topK(defaultTopK)
                .similarityThreshold(similarityThreshold)
                .build();
        List<Document> recalledDocuments = vectorStore.similaritySearch(searchRequest);

        logger.info("========== RAG 召回阶段 ==========");
        logger.info("用户问题: {}", userMessage);
        logger.info("召回文档数量: {}", recalledDocuments != null ? recalledDocuments.size() : 0);

        List<Document> relevantDocuments;
        if (recalledDocuments != null && !recalledDocuments.isEmpty()) {
            logger.info("---------- 召回文档内容 ----------");
            for (int i = 0; i < recalledDocuments.size(); i++) {
                Document doc = recalledDocuments.get(i);
                logger.info("【召回文档 {}】内容: {}", i + 1, doc.getText());
                logger.info("【召回文档 {}】元数据: {}", i + 1, doc.getMetadata());
            }

            logger.info("========== RAG 重排阶段 ==========");
            relevantDocuments = rerankDocuments(userMessage, recalledDocuments);

            logger.info("---------- 重排后文档内容 ----------");
            for (int i = 0; i < relevantDocuments.size(); i++) {
                Document doc = relevantDocuments.get(i);
                logger.info("【重排文档 {}】内容: {}", i + 1, doc.getText());
            }
        } else {
            logger.warn("---------- RAG 召回阶段 ----------");
            logger.warn("未检索到任何相关文档！知识库可能为空或检索条件太严格");
            relevantDocuments = List.of();
        }

        String knowledgeContext = "";
        if (!relevantDocuments.isEmpty()) {
            knowledgeContext = relevantDocuments.stream()
                    .map(doc -> doc.getText())
                    .collect(Collectors.joining("\n\n"));
        }

        List<Message> messages = history.stream()
                .map(msg -> {
                    if ("user".equals(msg.getRole())) {
                        return new UserMessage(msg.getContent());
                    } else {
                        return new AssistantMessage(msg.getContent());
                    }
                })
                .collect(Collectors.toList());

        String finalKnowledgeContext = knowledgeContext;
        String userQuery = finalKnowledgeContext.isEmpty()
                ? userMessage
                : userMessage + "\n\n【相关知识库信息】\n" + finalKnowledgeContext + "\n\n请根据以上知识库信息结合对话历史来回答用户的问题。";

        return chatClient.prompt()
                .messages(messages)
                .user(userQuery)
                .stream()
                .content();
    }

    private List<Document> rerankDocuments(String query, List<Document> documents) {
        if (documents == null || documents.isEmpty()) {
            return List.of();
        }

        List<RerankResult> ranked = documents.stream()
                .map(doc -> {
                    double score = calculateRelevanceScore(query, doc);
                    return new RerankResult(doc, score);
                })
                .sorted((a, b) -> Double.compare(b.score, a.score))
                .limit(rerankTopK)
                .peek(result -> logger.info("重排评分 - 文档: {}..., 评分: {}",
                        result.document.getText().substring(0, Math.min(50, result.document.getText().length())),
                        String.format("%.4f", result.score)))
                .toList();

        List<Document> finalDocuments = ranked.stream()
                .map(result -> result.document)
                .collect(Collectors.toList());

        logger.info("重排完成，保留 {} 条最相关文档（从 {} 条召回文档中）", finalDocuments.size(), documents.size());
        return finalDocuments;
    }

    private double calculateRelevanceScore(String query, Document document) {
        try {
            String prompt = String.format("""
                请评估以下文档与用户问题的相关性。

                用户问题：%s

                文档内容：%s

                请只返回一个0到1之间的数字评分，其中：
                - 1表示文档与问题高度相关，直接回答了问题
                - 0.5表示文档与问题有一定相关性，但不够直接
                - 0表示文档与问题完全不相关

                只返回数字，不要返回任何其他文字。
                """, query, document.getText());

            String response = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();

            response = response.trim().replaceAll("[^0-9.]", "");
            if (response.isEmpty()) {
                return 0.0;
            }
            double score = Double.parseDouble(response);
            return Math.max(0.0, Math.min(1.0, score));
        } catch (Exception e) {
            logger.error("重排评分计算失败: {}", e.getMessage());
            return 0.0;
        }
    }

    private static class RerankResult {
        Document document;
        double score;

        RerankResult(Document document, double score) {
            this.document = document;
            this.score = score;
        }
    }
}