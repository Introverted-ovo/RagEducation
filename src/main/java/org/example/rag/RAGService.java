package org.example.rag;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
public class RAGService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;

    public RAGService(ChatClient chatClient, VectorStore vectorStore) {
        this.chatClient = chatClient;
        this.vectorStore = vectorStore;
    }

    public Flux<String> query(String userMessage) {
        return chatClient.prompt()
                .user(userMessage)
                .stream()
                .content();
    }
}