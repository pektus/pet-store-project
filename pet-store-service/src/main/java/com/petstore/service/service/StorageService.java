package com.petstore.service.service;

import jakarta.servlet.http.Part;
import org.springframework.core.io.Resource;

import java.io.InputStream;
import java.nio.file.Path;

public interface StorageService {
    void init();
    String store(Part part);
    String store(InputStream inputStream, String originalFilename, String contentType);
    Path load(String filename);
    Resource loadAsResource(String filename);
    void delete(String filename);
    String probeContentType(String filename);
}
