package com.petstore.service.service.impl;

import com.petstore.service.exception.InvalidFileException;
import com.petstore.service.exception.ResourceNotFoundException;
import com.petstore.service.exception.StorageException;
import com.petstore.service.service.StorageService;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.Part;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class FileSystemStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(FileSystemStorageService.class);

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
    );

    private final Path rootLocation;

    public FileSystemStorageService(@Value("${app.storage.upload-dir:uploads}") String uploadDir) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @Override
    @PostConstruct
    public void init() {
        try {
            if (!Files.exists(rootLocation)) {
                Files.createDirectories(rootLocation);
                log.info("Storage directory initialized at: {}", rootLocation);
            }
        } catch (IOException e) {
            throw new StorageException("Could not initialize storage directory: " + rootLocation, e);
        }
    }

    @Override
    public String store(Part part) {
        if (part == null) {
            throw new InvalidFileException("Cannot store null upload part");
        }
        try {
            return store(part.getInputStream(), part.getSubmittedFileName(), part.getContentType());
        } catch (IOException e) {
            throw new StorageException("Failed to read upload stream from part", e);
        }
    }

    @Override
    public String store(InputStream inputStream, String originalFilename, String contentType) {
        if (inputStream == null) {
            throw new InvalidFileException("Upload stream is empty");
        }

        // Validate content type
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new InvalidFileException("Unsupported media type: " + contentType + ". Allowed: JPEG, PNG, WebP");
        }

        // Extract and validate extension
        String extension = extractExtension(originalFilename, contentType);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase(Locale.ROOT))) {
            throw new InvalidFileException("Unsupported file extension: " + extension);
        }

        String generatedFilename = UUID.randomUUID() + extension;
        Path destinationFile = this.rootLocation.resolve(Paths.get(generatedFilename)).normalize().toAbsolutePath();

        // Path traversal guard
        if (!destinationFile.getParent().equals(this.rootLocation)) {
            throw new StorageException("Cannot store file outside target directory: " + generatedFilename);
        }

        try {
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored file successfully: {}", generatedFilename);
            return generatedFilename;
        } catch (IOException e) {
            throw new StorageException("Failed to persist file: " + generatedFilename, e);
        }
    }

    @Override
    public Path load(String filename) {
        String cleanFilename = Paths.get(filename).getFileName().toString();
        Path file = rootLocation.resolve(cleanFilename).normalize().toAbsolutePath();
        if (!file.getParent().equals(rootLocation)) {
            throw new StorageException("Invalid path reference: " + filename);
        }
        return file;
    }

    @Override
    public Resource loadAsResource(String filename) {
        try {
            Path file = load(filename);
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Media file not found or unreadable: " + filename);
            }
        } catch (MalformedURLException e) {
            throw new StorageException("Malformed URL for file: " + filename, e);
        }
    }

    @Override
    public void delete(String filename) {
        if (filename == null || filename.isBlank()) {
            return;
        }
        try {
            Path file = load(filename);
            if (Files.exists(file)) {
                Files.delete(file);
                log.info("Deleted media asset: {}", filename);
            }
        } catch (Exception e) {
            log.warn("Failed to delete media asset: {}. Reason: {}", filename, e.getMessage());
        }
    }

    @Override
    public String probeContentType(String filename) {
        try {
            Path file = load(filename);
            String probed = Files.probeContentType(file);
            return (probed != null) ? probed : "application/octet-stream";
        } catch (IOException e) {
            return "application/octet-stream";
        }
    }

    private String extractExtension(String filename, String contentType) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf("."));
        }
        return switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> "";
        };
    }
}
