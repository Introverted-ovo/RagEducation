package org.example.conversation;

import org.example.rag.RAGService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final RAGService ragService;
    private final ConversationService conversationService;

    public ChatController(RAGService ragService, ConversationService conversationService) {
        this.ragService = ragService;
        this.conversationService = conversationService;
    }

    @PostMapping("/stream")
    public Flux<String> streamChat(@RequestBody ChatRequest request) {
        String conversationId = request.getConversationId();
        String userMessage = request.getMessage();

        if (conversationId != null && userMessage != null) {
            conversationService.addUserMessage(conversationId, userMessage);
        }

        Flux<String> responseFlux = ragService.query(conversationId, userMessage);

        if (conversationId != null) {
            responseFlux = responseFlux
                    .collectList()
                    .flatMapMany(completeResponse -> {
                        String fullResponse = String.join("", completeResponse);
                        conversationService.addAssistantMessage(conversationId, fullResponse);
                        return Flux.fromIterable(completeResponse);
                    });
        }

        return responseFlux;
    }

    public static class ChatRequest {
        private String conversationId;
        private String message;

        public String getConversationId() {
            return conversationId;
        }

        public void setConversationId(String conversationId) {
            this.conversationId = conversationId;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}