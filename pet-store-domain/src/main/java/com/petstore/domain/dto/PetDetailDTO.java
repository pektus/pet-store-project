package com.petstore.domain.dto;

import com.petstore.domain.enums.PetStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record PetDetailDTO(
    Long id,
    String name,
    String category,
    String breed,
    Integer ageMonths,
    BigDecimal price,
    PetStatus status,
    String description,
    String photoUrl,
    Instant createdAt,
    Instant updatedAt
) {}
