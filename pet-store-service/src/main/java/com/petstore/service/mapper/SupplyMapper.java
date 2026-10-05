package com.petstore.service.mapper;

import com.petstore.domain.dto.SupplyCreateRequest;
import com.petstore.domain.dto.SupplyResponseDTO;
import com.petstore.domain.dto.SupplyUpdateRequest;
import com.petstore.domain.entity.Supply;
import com.petstore.domain.enums.SupplyStatus;
import org.springframework.stereotype.Component;

@Component
public class SupplyMapper {

    public SupplyResponseDTO toDTO(Supply supply) {
        if (supply == null) {
            return null;
        }
        return new SupplyResponseDTO(
                supply.getId(),
                supply.getSku(),
                supply.getName(),
                supply.getCategory(),
                supply.getPrice(),
                supply.getStockQuantity(),
                supply.getLowStockThreshold(),
                supply.getStatus(),
                supply.isLowStock(),
                supply.isOutOfStock(),
                supply.getItemType(),
                supply.getDescription(),
                supply.getPhotoUrl(),
                supply.getCreatedAt(),
                supply.getUpdatedAt()
        );
    }

    public Supply toEntity(SupplyCreateRequest request, String resolvedSku) {
        if (request == null) {
            return null;
        }
        return new Supply(
                resolvedSku,
                request.name(),
                request.category(),
                request.price(),
                request.stockQuantity() != null ? request.stockQuantity() : 0,
                request.lowStockThreshold() != null ? request.lowStockThreshold() : 5,
                SupplyStatus.ACTIVE,
                request.description(),
                request.photoUrl()
        );
    }

    public void updateEntity(Supply supply, SupplyUpdateRequest request) {
        if (supply == null || request == null) {
            return;
        }
        supply.setName(request.name());
        supply.setCategory(request.category());
        supply.setPrice(request.price());
        if (request.lowStockThreshold() != null) {
            supply.setLowStockThreshold(request.lowStockThreshold());
        }
        if (request.status() != null) {
            supply.setStatus(request.status());
        }
        supply.setDescription(request.description());
        supply.setPhotoUrl(request.photoUrl());
        supply.evaluateStockStatus();
    }
}
