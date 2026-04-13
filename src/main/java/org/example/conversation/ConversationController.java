package org.example.conversation;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @GetMapping
    public List<ConversationService.ConversationDto> getConversations() {
        return conversationService.getConversations();
    }

    @PostMapping
    public Map<String, String> createConversation(@RequestBody(required = false) Map<String, String> body) {
        String title = body != null ? body.getOrDefault("title", "New Conversation") : "New Conversation";
        String conversationId = conversationService.createConversation(title);
        return Map.of("conversationId", conversationId);
    }

    @GetMapping("/{id}/messages")
    public List<ConversationService.MessageDto> getMessages(@PathVariable("id") String conversationId) {
        return conversationService.getMessages(conversationId);
    }

    @DeleteMapping("/{id}")
    public void deleteConversation(@PathVariable("id") String conversationId) {
        conversationService.deleteConversation(conversationId);
    }

    @PatchMapping("/{id}")
    public void updateConversationTitle(@PathVariable("id") String conversationId, @RequestBody Map<String, String> body) {
        String title = body.get("title");
        if (title != null) {
            conversationService.updateTitle(conversationId, title);
        }
    }
}