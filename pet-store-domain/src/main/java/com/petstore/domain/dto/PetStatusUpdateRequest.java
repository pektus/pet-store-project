package com.petstore.domain.dto;

import com.petstore.domain.enums.PetStatus;
import jakarta.validation.constraints.NotNull;

public record PetStatusUpdateRequest(
    @NotNull(message = "Status is required")
    PetStatus status
) {}
