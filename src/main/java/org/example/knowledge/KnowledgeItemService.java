package org.example.knowledge;

import org.example.knowledge.dto.KnowledgeItemDto;
import org.example.knowledge.dto.KnowledgeUpdateRequest;
import org.example.knowledge.dto.ManualEntryRequest;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class KnowledgeItemService {

    private final VectorStore vectorStore;
    private final JdbcTemplate jdbcTemplate;
    private final IndexService indexService;

    public KnowledgeItemService(VectorStore vectorStore, JdbcTemplate jdbcTemplate, IndexService indexService) {
        this.vectorStore = vectorStore;
        this.jdbcTemplate = jdbcTemplate;
        this.indexService = indexService;
        initTable();
    }

    private void initTable() {
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_items (
                id VARCHAR(36) PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                content TEXT NOT NULL,
                tags VARCHAR(500),
                source VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                vector_id TEXT
            )
        """);
    }

    public String addManualEntry(ManualEntryRequest request) {
        String id = UUID.randomUUID().toString();
        String content = request.getContent();
        String tags = request.getTags() != null ? request.getTags() : "";

        String metadata = String.format("manual://%s (tags: %s)", request.getTitle(), tags);

        List<String> documentIds = indexService.indexText(content, metadata, request.getTitle());
        String vectorIdStr = documentIds != null ? String.join(",", documentIds) : null;

        jdbcTemplate.update("""
            INSERT INTO knowledge_items (id, title, content, tags, source, created_at, vector_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, id, request.getTitle(), content, tags, "manual", LocalDateTime.now(), vectorIdStr);

        return id;
    }

    public String addUploadedFile(String title, String content, String tags, String source, String vectorIdStr) {
        String id = UUID.randomUUID().toString();
        jdbcTemplate.update("""
            INSERT INTO knowledge_items (id, title, content, tags, source, created_at, vector_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, id, title, content, tags, source, LocalDateTime.now(), vectorIdStr);
        return id;
    }

    public List<KnowledgeItemDto> listItems(int page, int size, String keyword) {
        int offset = page * size;
        String searchPattern = "%" + (keyword != null ? keyword : "") + "%";

        List<KnowledgeItemDto> items = jdbcTemplate.query("""
            SELECT id, title, content, tags, source, created_at
            FROM knowledge_items
            WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            (rs, rowNum) -> new KnowledgeItemDto(
                    rs.getString("id"),
                    rs.getString("title"),
                    truncate(rs.getString("content"), 200),
                    rs.getString("tags"),
                    rs.getString("source"),
                    rs.getTimestamp("created_at").toLocalDateTime()
            ),
            searchPattern, searchPattern, searchPattern, size, offset);

        return items;
    }

    public Optional<KnowledgeItemDto> getItem(String id) {
        try {
            KnowledgeItemDto item = jdbcTemplate.queryForObject("""
                SELECT id, title, content, tags, source, created_at
                FROM knowledge_items
                WHERE id = ?
                """,
                (rs, rowNum) -> new KnowledgeItemDto(
                        rs.getString("id"),
                        rs.getString("title"),
                        rs.getString("content"),
                        rs.getString("tags"),
                        rs.getString("source"),
                        rs.getTimestamp("created_at").toLocalDateTime()
                ),
                id);
            return Optional.ofNullable(item);
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public boolean updateItem(String id, KnowledgeUpdateRequest request) {
        List<String> oldVectorIds = getVectorIds(id);
        if (oldVectorIds != null && !oldVectorIds.isEmpty()) {
            indexService.deleteFromVectorStore(oldVectorIds);
        }

        String metadata = String.format("manual://%s (tags: %s)",
                request.getTitle(),
                request.getTags() != null ? request.getTags() : "");
        List<String> newDocumentIds = indexService.indexText(request.getContent(), metadata, request.getTitle());
        String vectorIdStr = newDocumentIds != null ? String.join(",", newDocumentIds) : null;

        int updated = jdbcTemplate.update("""
            UPDATE knowledge_items
            SET title = ?, content = ?, tags = ?, vector_id = ?
            WHERE id = ?
            """, request.getTitle(), request.getContent(),
            request.getTags() != null ? request.getTags() : "", vectorIdStr, id);

        return updated > 0;
    }

    public boolean deleteItem(String id) {
        List<String> vectorIds = getVectorIds(id);
        if (vectorIds != null && !vectorIds.isEmpty()) {
            indexService.deleteFromVectorStore(vectorIds);
        }
        int deleted = jdbcTemplate.update("DELETE FROM knowledge_items WHERE id = ?", id);
        return deleted > 0;
    }

    private List<String> getVectorIds(String id) {
        try {
            String vectorIdStr = jdbcTemplate.queryForObject(
                "SELECT vector_id FROM knowledge_items WHERE id = ?",
                String.class, id);
            if (vectorIdStr != null && !vectorIdStr.isEmpty()) {
                return List.of(vectorIdStr.split(","));
            }
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            return null;
        }
        return null;
    }

    public int getTotalCount(String keyword) {
        String searchPattern = "%" + (keyword != null ? keyword : "") + "%";
        Integer count = jdbcTemplate.queryForObject("""
            SELECT COUNT(*) FROM knowledge_items
            WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
            """, Integer.class, searchPattern, searchPattern, searchPattern);
        return count != null ? count : 0;
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    }
}