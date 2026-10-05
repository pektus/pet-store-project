package com.petstore.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerProfileUpdateRequest(
    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name cannot exceed 100 characters")
    String fullName,

    @Size(max = 30, message = "Phone cannot exceed 30 characters")
    String phone
) {}
