package com.petstore.web.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class StorageConfig {

    private static final Logger log = LoggerFactory.getLogger(StorageConfig.class);

    @Value("${app.storage.upload-dir:uploads}")
    private String uploadDir;

    @PostConstruct
    public void verifyStorage() {
        Path path = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }
            if (!Files.isWritable(path)) {
                log.warn("Storage directory is not writable: {}", path);
            } else {
                log.info("Storage directory verified and ready at: {}", path);
            }
        } catch (IOException e) {
            log.error("Failed to verify/create storage directory at: {}", path, e);
        }
    }
}
