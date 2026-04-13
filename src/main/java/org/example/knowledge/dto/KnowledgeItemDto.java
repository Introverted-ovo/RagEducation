package org.example.knowledge.dto;

import java.time.LocalDateTime;

public class KnowledgeItemDto {

    private String id;
    private String title;
    private String contentPreview;
    private String tags;
    private String source;
    private LocalDateTime createdAt;

    public KnowledgeItemDto() {
    }

    public KnowledgeItemDto(String id, String title, String contentPreview, String tags, String source, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.contentPreview = contentPreview;
        this.tags = tags;
        this.source = source;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContentPreview() {
        return contentPreview;
    }

    public void setContentPreview(String contentPreview) {
        this.contentPreview = contentPreview;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}