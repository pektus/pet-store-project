package com.petstore.domain.dto;

public record VerifyEmailResponse(
    String message,
    String token,
    String tokenType,
    long expiresIn,
    UserProfileDTO user
) {}
