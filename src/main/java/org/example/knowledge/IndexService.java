package org.example.knowledge;

import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class IndexService {

    private final VectorStore vectorStore;
    private final TokenTextSplitter textSplitter = new TokenTextSplitter();
    private final DocumentService documentService;

    @Value("${app.rag.upload-path:./uploads}")
    private String uploadPath;

    public IndexService(VectorStore vectorStore, DocumentService documentService) {
        this.vectorStore = vectorStore;
        this.documentService = documentService;
    }

    public String uploadAndIndex(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            originalFilename = "unknown";
        }

        String savedFileName = UUID.randomUUID() + "_" + originalFilename;
        Path uploadDir = Path.of(uploadPath);
        Files.createDirectories(uploadDir);
        Path filePath = uploadDir.resolve(savedFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        String fileType = getFileType(originalFilename);
        String extractedText = documentService.parseDocument(file);

        String metadata = String.format("file://%s (type: %s, size: %d bytes)",
                originalFilename, fileType, file.getSize());

        List<String> ids = indexText(extractedText, metadata, originalFilename);
        return String.format("Indexed %d chunks from: %s", ids.size(), originalFilename);
    }

    public String extractText(MultipartFile file) throws IOException {
        return documentService.parseDocument(file);
    }

    public List<String> indexTextAndReturnIds(String text, String metadata, String title) {
        return indexText(text, metadata, title);
    }

    public List<String> indexText(String text, String metadata, String title) {
        Document document = Document.builder()
                .text(text)
                .metadata("source", metadata)
                .metadata("title", title)
                .build();

        List<Document> documents = textSplitter.apply(List.of(document));

        List<Document> documentsWithIds = documents.stream()
                .map(doc -> {
                    if (doc.getId() == null || doc.getId().isEmpty()) {
                        return Document.builder()
                                .text(doc.getText())
                                .metadata(doc.getMetadata())
                                .id(UUID.randomUUID().toString())
                                .build();
                    }
                    return doc;
                })
                .collect(Collectors.toList());

        vectorStore.add(documentsWithIds);

        return documentsWithIds.stream()
                .map(Document::getId)
                .collect(Collectors.toList());
    }

    public void deleteFromVectorStore(List<String> documentIds) {
        if (documentIds != null && !documentIds.isEmpty()) {
            vectorStore.delete(documentIds);
        }
    }

    public String indexTextReturnString(String text, String metadata, String title) {
        List<String> ids = indexText(text, metadata, title);
        return String.format("Indexed %d chunks from: %s", ids.size(), title);
    }

    private String getFileType(String filename) {
        if (filename == null) return "unknown";
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex > 0 && dotIndex < filename.length() - 1) {
            return filename.substring(dotIndex + 1).toLowerCase();
        }
        return "unknown";
    }
}