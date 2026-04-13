package org.example.conversation;

import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/{id}/messages")
    public List<ConversationService.MessageDto> getMessages(@PathVariable("id") String conversationId) {
        return conversationService.getMessages(conversationId);
    }

    @DeleteMapping("/{id}")
    public void deleteConversation(@PathVariable("id") String conversationId) {
        conversationService.deleteConversation(conversationId);
    }
}