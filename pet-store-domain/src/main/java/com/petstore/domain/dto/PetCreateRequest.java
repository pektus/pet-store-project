package com.petstore.domain.dto;

import com.petstore.domain.enums.PetStatus;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record PetCreateRequest(
    @NotBlank(message = "Pet name is required")
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    String name,

    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category name must not exceed 50 characters")
    String category,

    @NotBlank(message = "Breed is required")
    @Size(max = 60, message = "Breed must not exceed 60 characters")
    String breed,

    @NotNull(message = "Age in months is required")
    @Min(value = 0, message = "Age cannot be negative")
    @Max(value = 360, message = "Age cannot exceed 360 months")
    Integer ageMonths,

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", message = "Price cannot be negative")
    @Digits(integer = 7, fraction = 2, message = "Price must conform to monetary format")
    BigDecimal price,

    @NotNull(message = "Initial status is required")
    PetStatus status,

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    String description,

    @Pattern(regexp = "^(/api/media/[a-zA-Z0-9._-]+)?$", message = "Invalid photo URL format")
    String photoUrl
) {}
