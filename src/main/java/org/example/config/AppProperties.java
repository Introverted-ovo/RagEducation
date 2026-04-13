package org.example.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.rag")
public class AppProperties {

    private Integer defaultTopK = 5;
    private Double similarityThreshold = 0.7;
    private String uploadPath = "./uploads";

    public Integer getDefaultTopK() {
        return defaultTopK;
    }

    public void setDefaultTopK(Integer defaultTopK) {
        this.defaultTopK = defaultTopK;
    }

    public Double getSimilarityThreshold() {
        return similarityThreshold;
    }

    public void setSimilarityThreshold(Double similarityThreshold) {
        this.similarityThreshold = similarityThreshold;
    }

    public String getUploadPath() {
        return uploadPath;
    }

    public void setUploadPath(String uploadPath) {
        this.uploadPath = uploadPath;
    }
}