package com.petstore.domain.dto;

import com.petstore.domain.enums.UserRole;

public record UserProfileDTO(
    Long id,
    String username,
    String email,
    UserRole role,
    String fullName,
    String phone,
    boolean isEmailVerified
) {
    public UserProfileDTO(Long id, String username, String email, UserRole role) {
        this(id, username, email, role, null, null, true);
    }
}
