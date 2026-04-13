package org.example.conversation;

import org.example.rag.RAGService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final RAGService ragService;

    public ChatController(RAGService ragService) {
        this.ragService = ragService;
    }

    @PostMapping("/stream")
    public Flux<String> streamChat(@RequestBody ChatRequest request) {
        return ragService.query(request.getMessage());
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