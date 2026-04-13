package org.example.llm;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
public class LLMClientService {

    private final ChatClient chatClient;

    public LLMClientService(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    public Flux<String> streamResponse(String userMessage) {
        return chatClient.prompt()
                .user(userMessage)
                .stream()
                .content();
    }
}
