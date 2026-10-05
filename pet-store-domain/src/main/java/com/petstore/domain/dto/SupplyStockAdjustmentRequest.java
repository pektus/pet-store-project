package com.petstore.domain.dto;

import jakarta.validation.constraints.NotNull;

public record SupplyStockAdjustmentRequest(
    @NotNull(message = "Stock adjustment quantity is required")
    Integer adjustment,

    String reason
) {}
