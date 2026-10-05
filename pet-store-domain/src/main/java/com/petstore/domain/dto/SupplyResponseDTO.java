package com.petstore.domain.dto;

import com.petstore.domain.enums.ItemType;
import com.petstore.domain.enums.SupplyCategory;
import com.petstore.domain.enums.SupplyStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record SupplyResponseDTO(
    Long id,
    String sku,
    String name,
    SupplyCategory category,
    BigDecimal price,
    Integer stockQuantity,
    Integer lowStockThreshold,
    SupplyStatus status,
    boolean isLowStock,
    boolean isOutOfStock,
    ItemType itemType,
    String description,
    String photoUrl,
    Instant createdAt,
    Instant updatedAt
) {}
