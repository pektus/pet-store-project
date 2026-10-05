package com.petstore.web.controller;

import com.petstore.domain.dto.PageResponse;
import com.petstore.domain.dto.SupplyCreateRequest;
import com.petstore.domain.dto.SupplyResponseDTO;
import com.petstore.domain.dto.SupplyStockAdjustmentRequest;
import com.petstore.domain.dto.SupplyUpdateRequest;
import com.petstore.domain.enums.SupplyCategory;
import com.petstore.domain.enums.SupplyStatus;
import com.petstore.service.service.SupplyService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URI;
import java.util.Arrays;
import java.util.List;

@RestController
public class SupplyController {

    private final SupplyService supplyService;

    public SupplyController(SupplyService supplyService) {
        this.supplyService = supplyService;
    }

    // --- Public Endpoints ---

    @GetMapping("/api/supplies")
    public ResponseEntity<PageResponse<SupplyResponseDTO>> getSupplies(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) SupplyCategory category,
            @RequestParam(required = false) SupplyStatus status,
            @RequestParam(required = false, defaultValue = "false") Boolean inStockOnly,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        Pageable pageable = createPageable(page, size, sort);
        PageResponse<SupplyResponseDTO> response = supplyService.getSupplies(
                search, category, status, inStockOnly, minPrice, maxPrice, pageable
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/supplies/{id}")
    public ResponseEntity<SupplyResponseDTO> getSupplyById(@PathVariable Long id) {
        return ResponseEntity.ok(supplyService.getSupplyById(id));
    }

    @GetMapping("/api/supplies/categories")
    public ResponseEntity<List<String>> getCategories() {
        List<String> categories = Arrays.stream(SupplyCategory.values())
                .map(Enum::name)
                .toList();
        return ResponseEntity.ok(categories);
    }

    // --- Admin Protected Endpoints ---

    @PostMapping("/api/admin/supplies")
    public ResponseEntity<SupplyResponseDTO> createSupply(@Valid @RequestBody SupplyCreateRequest request) {
        SupplyResponseDTO created = supplyService.createSupply(request);
        URI location = URI.create("/api/supplies/" + created.id());
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/api/admin/supplies/{id}")
    public ResponseEntity<SupplyResponseDTO> updateSupply(
            @PathVariable Long id,
            @Valid @RequestBody SupplyUpdateRequest request) {
        SupplyResponseDTO updated = supplyService.updateSupply(id, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/api/admin/supplies/{id}/stock")
    public ResponseEntity<SupplyResponseDTO> adjustStock(
            @PathVariable Long id,
            @Valid @RequestBody SupplyStockAdjustmentRequest request) {
        SupplyResponseDTO adjusted = supplyService.adjustStock(id, request.adjustment(), request.reason());
        return ResponseEntity.ok(adjusted);
    }

    @DeleteMapping("/api/admin/supplies/{id}")
    public ResponseEntity<Void> deleteSupply(@PathVariable Long id) {
        supplyService.deleteSupply(id);
        return ResponseEntity.noContent().build();
    }

    private Pageable createPageable(int page, int size, String sort) {
        int boundedSize = Math.min(Math.max(1, size), 100);
        int boundedPage = Math.max(0, page);

        Sort sorting = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String property = parts[0].trim();
            Sort.Direction direction = (parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim()))
                    ? Sort.Direction.ASC
                    : Sort.Direction.DESC;
            sorting = Sort.by(direction, property);
        }

        return PageRequest.of(boundedPage, boundedSize, sorting);
    }
}
