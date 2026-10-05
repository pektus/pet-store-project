package com.petstore.domain.dto;

import com.petstore.domain.enums.SupplyCategory;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record SupplyCreateRequest(
    @Size(max = 50, message = "SKU cannot exceed 50 characters")
    @Pattern(regexp = "^[A-Za-z0-9_-]*$", message = "SKU can only contain alphanumeric characters, underscores, and hyphens")
    String sku,

    @NotBlank(message = "Supply name is required")
    @Size(min = 2, max = 100, message = "Supply name must be between 2 and 100 characters")
    String name,

    @NotNull(message = "Category is required")
    SupplyCategory category,

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", message = "Price cannot be negative")
    BigDecimal price,

    @Min(value = 0, message = "Stock quantity cannot be negative")
    Integer stockQuantity,

    @Min(value = 0, message = "Low stock threshold cannot be negative")
    Integer lowStockThreshold,

    String description,
    String photoUrl
) {}
