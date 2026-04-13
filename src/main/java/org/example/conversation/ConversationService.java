package org.example.conversation;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

@Service
public class ConversationService {

    private final Map<String, List<MessageDto>> messageStore = new ConcurrentHashMap<>();

    public List<ConversationDto> getConversations() {
        List<ConversationDto> conversations = new ArrayList<>();
        for (String convId : messageStore.keySet()) {
            ConversationDto dto = new ConversationDto();
            dto.setConversationId(convId);
            List<MessageDto> msgs = messageStore.get(convId);
            if (!msgs.isEmpty()) {
                String content = msgs.get(0).getContent();
                dto.setTitle(content.substring(0, Math.min(30, content.length())));
                dto.setUpdateTime(msgs.get(msgs.size() - 1).getTimestamp().toString());
            }
            conversations.add(dto);
        }
        return conversations;
    }

    public List<MessageDto> getMessages(String conversationId) {
        return messageStore.getOrDefault(conversationId, new ArrayList<>());
    }

    public void addUserMessage(String conversationId, String content) {
        MessageDto userMessage = new MessageDto();
        userMessage.setId(UUID.randomUUID().toString());
        userMessage.setRole("user");
        userMessage.setContent(content);
        userMessage.setTimestamp(LocalDateTime.now());
        messageStore.computeIfAbsent(conversationId, k -> new ArrayList<>()).add(userMessage);
    }

    public void addAssistantMessage(String conversationId, String content) {
        MessageDto assistantMessage = new MessageDto();
        assistantMessage.setId(UUID.randomUUID().toString());
        assistantMessage.setRole("assistant");
        assistantMessage.setContent(content);
        assistantMessage.setTimestamp(LocalDateTime.now());
        messageStore.computeIfAbsent(conversationId, k -> new ArrayList<>()).add(assistantMessage);
    }

    public void deleteConversation(String conversationId) {
        messageStore.remove(conversationId);
    }

    public static class MessageDto {
        private String id;
        private String role;
        private String content;
        private LocalDateTime timestamp;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    }

    public static class ConversationDto {
        private String conversationId;
        private String title;
        private String updateTime;

        public String getConversationId() { return conversationId; }
        public void setConversationId(String conversationId) { this.conversationId = conversationId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getUpdateTime() { return updateTime; }
        public void setUpdateTime(String updateTime) { this.updateTime = updateTime; }
    }
}