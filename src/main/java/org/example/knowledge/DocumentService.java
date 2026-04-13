package org.example.knowledge;

import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    private final VectorStore vectorStore;
    private final TokenTextSplitter textSplitter = new TokenTextSplitter();

    public DocumentService(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    public String parseDocument(MultipartFile file) throws IOException {
        Path uploadPath = Path.of("./uploads");
        Files.createDirectories(uploadPath);

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        Resource resource = new org.springframework.core.io.FileSystemResource(filePath);
        TikaDocumentReader reader = new TikaDocumentReader(resource);
        var documents = reader.get();
        return documents.stream()
                .map(doc -> doc.getText())
                .collect(Collectors.joining("\n"));
    }

    public void indexText(String text, String metadata) {
        var document = org.springframework.ai.document.Document.builder()
                .text(text)
                .metadata("source", metadata)
                .build();

        var documents = textSplitter.apply(java.util.Collections.singletonList(document));
        vectorStore.add(documents);
    }
}