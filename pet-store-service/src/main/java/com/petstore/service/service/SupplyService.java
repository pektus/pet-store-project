package com.petstore.service.service;

import com.petstore.domain.dto.PageResponse;
import com.petstore.domain.dto.SupplyCreateRequest;
import com.petstore.domain.dto.SupplyResponseDTO;
import com.petstore.domain.dto.SupplyUpdateRequest;
import com.petstore.domain.enums.SupplyCategory;
import com.petstore.domain.enums.SupplyStatus;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface SupplyService {

    PageResponse<SupplyResponseDTO> getSupplies(
            String search,
            SupplyCategory category,
            SupplyStatus status,
            Boolean inStockOnly,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Pageable pageable
    );

    SupplyResponseDTO getSupplyById(Long id);

    SupplyResponseDTO getSupplyBySku(String sku);

    SupplyResponseDTO createSupply(SupplyCreateRequest request);

    SupplyResponseDTO updateSupply(Long id, SupplyUpdateRequest request);

    SupplyResponseDTO adjustStock(Long id, Integer adjustment, String reason);

    void deleteSupply(Long id);
}
