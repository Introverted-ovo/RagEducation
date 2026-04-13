package org.example.knowledge.dto;

public class KnowledgeUpdateRequest {

    private String title;
    private String content;
    private String tags;

    public KnowledgeUpdateRequest() {
    }

    public KnowledgeUpdateRequest(String title, String content, String tags) {
        this.title = title;
        this.content = content;
        this.tags = tags;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }
}