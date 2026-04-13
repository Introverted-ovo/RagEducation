package org.example.knowledge.dto;

import java.util.List;

public class KnowledgeListResponse {

    private List<KnowledgeItemDto> items;
    private int total;
    private int page;
    private int size;

    public KnowledgeListResponse() {
    }

    public KnowledgeListResponse(List<KnowledgeItemDto> items, int total, int page, int size) {
        this.items = items;
        this.total = total;
        this.page = page;
        this.size = size;
    }

    public List<KnowledgeItemDto> getItems() {
        return items;
    }

    public void setItems(List<KnowledgeItemDto> items) {
        this.items = items;
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }
}