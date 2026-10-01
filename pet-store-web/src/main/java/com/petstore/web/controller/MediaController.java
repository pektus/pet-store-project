package com.petstore.web.controller;

import com.petstore.domain.dto.MediaUploadResponse;
import com.petstore.service.service.StorageService;
import jakarta.servlet.http.Part;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private final StorageService storageService;

    public MediaController(StorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaUploadResponse> uploadFile(@RequestPart("file") Part file) {
        String filename = storageService.store(file);
        String fileUrl = "/api/media/" + filename;

        MediaUploadResponse response = new MediaUploadResponse(
                filename,
                fileUrl,
                file.getContentType(),
                file.getSize()
        );

        return ResponseEntity.created(URI.create(fileUrl)).body(response);
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> getMedia(@PathVariable String filename) {
        Resource resource = storageService.loadAsResource(filename);
        String contentType = storageService.probeContentType(filename);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .cacheControl(CacheControl.maxAge(1, TimeUnit.DAYS).cachePublic().immutable())
                .body(resource);
    }

    @DeleteMapping("/{filename:.+}")
    public ResponseEntity<Void> deleteMedia(@PathVariable String filename) {
        storageService.delete(filename);
        return ResponseEntity.noContent().build();
    }
}
