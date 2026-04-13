package org.example.conversation;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ConversationService {

    private final JdbcTemplate jdbcTemplate;

    public ConversationService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ConversationDto> getConversations() {
        String sql = "SELECT id, title, updated_at FROM conversations ORDER BY updated_at DESC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            ConversationDto dto = new ConversationDto();
            dto.setConversationId(rs.getString("id"));
            dto.setTitle(rs.getString("title"));
            dto.setUpdateTime(rs.getTimestamp("updated_at").toString());
            return dto;
        });
    }

    public String createConversation(String title) {
        String convId = UUID.randomUUID().toString();
        String sql = "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)";
        LocalDateTime now = LocalDateTime.now();
        jdbcTemplate.update(sql, convId, title, now, now);
        return convId;
    }

    public List<MessageDto> getMessages(String conversationId) {
        String sql = "SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            MessageDto dto = new MessageDto();
            dto.setId(rs.getString("id"));
            dto.setRole(rs.getString("role"));
            dto.setContent(rs.getString("content"));
            dto.setTimestamp(rs.getTimestamp("created_at").toLocalDateTime());
            return dto;
        }, conversationId);
    }

    public void addUserMessage(String conversationId, String content) {
        addMessage(conversationId, "user", content);
    }

    public void addAssistantMessage(String conversationId, String content) {
        addMessage(conversationId, "assistant", content);
    }

    private void addMessage(String conversationId, String role, String content) {
        String msgId = UUID.randomUUID().toString();
        String insertSql = "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(insertSql, msgId, conversationId, role, content, LocalDateTime.now());

        String updateSql = "UPDATE conversations SET updated_at = ? WHERE id = ?";
        jdbcTemplate.update(updateSql, LocalDateTime.now(), conversationId);
    }

    public void deleteConversation(String conversationId) {
        String deleteMessagesSql = "DELETE FROM messages WHERE conversation_id = ?";
        jdbcTemplate.update(deleteMessagesSql, conversationId);
        String deleteConvSql = "DELETE FROM conversations WHERE id = ?";
        jdbcTemplate.update(deleteConvSql, conversationId);
    }

    public void updateTitle(String conversationId, String title) {
        String sql = "UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?";
        jdbcTemplate.update(sql, title, LocalDateTime.now(), conversationId);
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