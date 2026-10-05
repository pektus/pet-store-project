package com.petstore.service.service.impl;

import com.petstore.domain.dto.PageResponse;
import com.petstore.domain.dto.SupplyCreateRequest;
import com.petstore.domain.dto.SupplyResponseDTO;
import com.petstore.domain.dto.SupplyUpdateRequest;
import com.petstore.domain.entity.Supply;
import com.petstore.domain.enums.SupplyCategory;
import com.petstore.domain.enums.SupplyStatus;
import com.petstore.service.exception.DuplicateResourceException;
import com.petstore.service.exception.ResourceNotFoundException;
import com.petstore.service.mapper.SupplyMapper;
import com.petstore.service.repository.SupplyRepository;
import com.petstore.service.repository.SupplySpecification;
import com.petstore.service.service.StorageService;
import com.petstore.service.service.SupplyService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class SupplyServiceImpl implements SupplyService {

    private final SupplyRepository supplyRepository;
    private final SupplyMapper supplyMapper;
    private final StorageService storageService;

    public SupplyServiceImpl(SupplyRepository supplyRepository,
                             SupplyMapper supplyMapper,
                             StorageService storageService) {
        this.supplyRepository = supplyRepository;
        this.supplyMapper = supplyMapper;
        this.storageService = storageService;
    }

    @Override
    public PageResponse<SupplyResponseDTO> getSupplies(
            String search,
            SupplyCategory category,
            SupplyStatus status,
            Boolean inStockOnly,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Pageable pageable) {

        Specification<Supply> spec = SupplySpecification.filterSupplies(
                search, category, status, inStockOnly, minPrice, maxPrice
        );

        Page<Supply> page = supplyRepository.findAll(spec, pageable);

        return new PageResponse<>(
                page.getContent().stream().map(supplyMapper::toDTO).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    @Override
    public SupplyResponseDTO getSupplyById(Long id) {
        Supply supply = supplyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Physical supply with ID " + id + " does not exist"));
        return supplyMapper.toDTO(supply);
    }

    @Override
    public SupplyResponseDTO getSupplyBySku(String sku) {
        Supply supply = supplyRepository.findBySku(sku.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Physical supply with SKU " + sku + " does not exist"));
        return supplyMapper.toDTO(supply);
    }

    @Override
    @Transactional
    public SupplyResponseDTO createSupply(SupplyCreateRequest request) {
        String resolvedSku;
        if (request.sku() != null && !request.sku().trim().isEmpty()) {
            resolvedSku = request.sku().trim().toUpperCase();
            if (supplyRepository.existsBySku(resolvedSku)) {
                throw new DuplicateResourceException("Supply with SKU '" + resolvedSku + "' already exists");
            }
        } else {
            resolvedSku = generateUniqueSku(request.category());
        }

        Supply supply = supplyMapper.toEntity(request, resolvedSku);
        Supply saved = supplyRepository.save(supply);
        return supplyMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SupplyResponseDTO updateSupply(Long id, SupplyUpdateRequest request) {
        Supply supply = supplyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Physical supply with ID " + id + " does not exist"));

        if (supply.getPhotoUrl() != null && !supply.getPhotoUrl().equals(request.photoUrl())) {
            cleanupMediaFile(supply.getPhotoUrl());
        }

        supplyMapper.updateEntity(supply, request);
        Supply updated = supplyRepository.save(supply);
        return supplyMapper.toDTO(updated);
    }

    @Override
    @Transactional
    public SupplyResponseDTO adjustStock(Long id, Integer adjustment, String reason) {
        Supply supply = supplyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Physical supply with ID " + id + " does not exist"));

        int updatedStock = supply.getStockQuantity() + adjustment;
        if (updatedStock < 0) {
            throw new IllegalArgumentException(
                    "Insufficient stock: adjustment of " + adjustment + " results in negative inventory (" + updatedStock + ")"
            );
        }

        supply.setStockQuantity(updatedStock);
        Supply saved = supplyRepository.save(supply);
        return supplyMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public void deleteSupply(Long id) {
        Supply supply = supplyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Physical supply with ID " + id + " does not exist"));

        if (supply.getPhotoUrl() != null) {
            cleanupMediaFile(supply.getPhotoUrl());
        }

        supplyRepository.delete(supply);
    }

    private String generateUniqueSku(SupplyCategory category) {
        String prefix = category != null ? category.name().substring(0, Math.min(3, category.name().length())) : "SUP";
        String candidate;
        do {
            candidate = "SKU-" + prefix + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        } while (supplyRepository.existsBySku(candidate));
        return candidate;
    }

    private void cleanupMediaFile(String photoUrl) {
        if (photoUrl != null && photoUrl.startsWith("/api/media/")) {
            String filename = photoUrl.substring("/api/media/".length());
            storageService.delete(filename);
        }
    }
}
