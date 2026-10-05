package com.petstore.domain.dto;

import com.petstore.domain.enums.SupplyCategory;
import com.petstore.domain.enums.SupplyStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record SupplyUpdateRequest(
    @NotBlank(message = "Supply name is required")
    @Size(min = 2, max = 100, message = "Supply name must be between 2 and 100 characters")
    String name,

    @NotNull(message = "Category is required")
    SupplyCategory category,

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", message = "Price cannot be negative")
    BigDecimal price,

    @Min(value = 0, message = "Low stock threshold cannot be negative")
    Integer lowStockThreshold,

    SupplyStatus status,
    String description,
    String photoUrl
) {}
