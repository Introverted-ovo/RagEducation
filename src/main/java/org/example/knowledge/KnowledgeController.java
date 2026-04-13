package org.example.knowledge;

import org.example.common.dto.ApiResponse;
import org.example.knowledge.dto.KnowledgeItemDto;
import org.example.knowledge.dto.KnowledgeListResponse;
import org.example.knowledge.dto.KnowledgeUpdateRequest;
import org.example.knowledge.dto.ManualEntryRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/knowledge")
public class KnowledgeController {

    private final IndexService indexService;
    private final KnowledgeItemService knowledgeItemService;

    public KnowledgeController(IndexService indexService, KnowledgeItemService knowledgeItemService) {
        this.indexService = indexService;
        this.knowledgeItemService = knowledgeItemService;
    }

    @PostMapping("/upload")
    public ApiResponse<String> uploadDocument(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ApiResponse.error(400, "File is empty");
            }
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isEmpty()) {
                originalFilename = "unknown";
            }

            String fileType = getFileType(originalFilename);
            String extractedText = indexService.extractText(file);
            String metadata = String.format("file://%s (type: %s, size: %d bytes)",
                    originalFilename, fileType, file.getSize());

            List<String> documentIds = indexService.indexText(extractedText, metadata, originalFilename);
            String vectorIdStr = documentIds != null ? String.join(",", documentIds) : null;

            String id = knowledgeItemService.addUploadedFile(
                    originalFilename,
                    extractedText,
                    "",
                    "file",
                    vectorIdStr
            );

            String result = String.format("Indexed %d chunks from: %s", documentIds.size(), originalFilename);
            return ApiResponse.success("Document uploaded and indexed successfully", result);
        } catch (IOException e) {
            return ApiResponse.error(500, "Failed to process document: " + e.getMessage());
        }
    }

    private String getFileType(String filename) {
        if (filename == null) return "unknown";
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex > 0 && dotIndex < filename.length() - 1) {
            return filename.substring(dotIndex + 1).toLowerCase();
        }
        return "unknown";
    }

    @PostMapping("/manual")
    public ApiResponse<String> addManualEntry(@RequestBody ManualEntryRequest request) {
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            return ApiResponse.error(400, "Title is required");
        }
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            return ApiResponse.error(400, "Content is required");
        }
        String id = knowledgeItemService.addManualEntry(request);
        return ApiResponse.success("Knowledge item added successfully", id);
    }

    @GetMapping("/items")
    public ApiResponse<KnowledgeListResponse> listItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        List<KnowledgeItemDto> items = knowledgeItemService.listItems(page, size, keyword);
        int total = knowledgeItemService.getTotalCount(keyword);
        KnowledgeListResponse response = new KnowledgeListResponse(items, total, page, size);
        return ApiResponse.success(response);
    }

    @GetMapping("/items/{id}")
    public ApiResponse<KnowledgeItemDto> getItem(@PathVariable String id) {
        return knowledgeItemService.getItem(id)
                .map(ApiResponse::success)
                .orElse(ApiResponse.error(404, "Knowledge item not found"));
    }

    @PutMapping("/items/{id}")
    public ApiResponse<Void> updateItem(@PathVariable String id, @RequestBody KnowledgeUpdateRequest request) {
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            return ApiResponse.error(400, "Title is required");
        }
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            return ApiResponse.error(400, "Content is required");
        }
        boolean updated = knowledgeItemService.updateItem(id, request);
        if (updated) {
            return ApiResponse.success(null);
        } else {
            return ApiResponse.error(404, "Knowledge item not found");
        }
    }

    @DeleteMapping("/items/{id}")
    public ApiResponse<Void> deleteItem(@PathVariable String id) {
        boolean deleted = knowledgeItemService.deleteItem(id);
        if (deleted) {
            return ApiResponse.success("Knowledge item deleted successfully", null);
        } else {
            return ApiResponse.error(404, "Knowledge item not found");
        }
    }
}