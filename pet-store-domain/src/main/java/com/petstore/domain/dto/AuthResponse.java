package com.petstore.domain.dto;

public record AuthResponse(
    String accessToken,
    String tokenType,
    long expiresIn,
    UserProfileDTO user
) {}
