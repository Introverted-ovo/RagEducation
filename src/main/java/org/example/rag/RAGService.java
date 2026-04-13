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
        List<Document> relevantDocuments = vectorStore.similaritySearch(searchRequest);

        logger.info("RAG检索调试 - 用户问题: {}", userMessage);
        logger.info("RAG检索调试 - 检索到文档数量: {}", relevantDocuments != null ? relevantDocuments.size() : 0);

        String knowledgeContext = "";
        if (relevantDocuments != null && !relevantDocuments.isEmpty()) {
            for (int i = 0; i < relevantDocuments.size(); i++) {
                Document doc = relevantDocuments.get(i);
                logger.info("RAG检索调试 - 文档{}内容: {}", i + 1, doc.getText());
            }
            knowledgeContext = relevantDocuments.stream()
                    .map(doc -> doc.getText())
                    .collect(Collectors.joining("\n\n"));
        } else {
            logger.warn("RAG检索调试 - 未检索到任何相关文档！知识库可能为空或检索条件太严格");
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
}