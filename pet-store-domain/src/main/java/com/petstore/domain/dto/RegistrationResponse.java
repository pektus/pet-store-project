package com.petstore.domain.dto;

public record RegistrationResponse(
    String message,
    String username,
    String email,
    String activationToken,
    String activationUrl
) {}
