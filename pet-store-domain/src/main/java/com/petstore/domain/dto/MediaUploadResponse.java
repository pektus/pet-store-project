package com.petstore.domain.dto;

public record MediaUploadResponse(
    String filename,
    String fileUrl,
    String contentType,
    long sizeBytes
) {}
