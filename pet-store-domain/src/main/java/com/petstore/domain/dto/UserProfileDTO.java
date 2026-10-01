package com.petstore.domain.dto;

import com.petstore.domain.enums.UserRole;

public record UserProfileDTO(
    Long id,
    String username,
    String email,
    UserRole role
) {}
