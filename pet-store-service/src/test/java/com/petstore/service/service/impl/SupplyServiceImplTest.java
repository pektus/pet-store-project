package com.petstore.service.service.impl;

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
import com.petstore.service.service.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupplyServiceImplTest {

    @Mock
    private SupplyRepository supplyRepository;

    @Mock
    private StorageService storageService;

    @Spy
    private SupplyMapper supplyMapper;

    @InjectMocks
    private SupplyServiceImpl supplyService;

    private Supply sampleSupply;

    @BeforeEach
    void setUp() {
        sampleSupply = new Supply(
                "SKU-FOOD-100",
                "Salmon Dog Food 10kg",
                SupplyCategory.FOOD,
                new BigDecimal("49.99"),
                20,
                5,
                SupplyStatus.ACTIVE,
                "Nutritious grain-free kibble",
                "/api/media/kibble.jpg"
        );
        sampleSupply.setId(1L);
    }

    @Test
    @DisplayName("Should create supply with manual SKU")
    void testCreateSupplyManualSku() {
        SupplyCreateRequest request = new SupplyCreateRequest(
                "SKU-FOOD-100",
                "Salmon Dog Food 10kg",
                SupplyCategory.FOOD,
                new BigDecimal("49.99"),
                20,
                5,
                "Nutritious grain-free kibble",
                "/api/media/kibble.jpg"
        );

        when(supplyRepository.existsBySku("SKU-FOOD-100")).thenReturn(false);
        when(supplyRepository.save(any(Supply.class))).thenAnswer(inv -> {
            Supply s = inv.getArgument(0);
            s.setId(1L);
            return s;
        });

        SupplyResponseDTO response = supplyService.createSupply(request);

        assertThat(response).isNotNull();
        assertThat(response.sku()).isEqualTo("SKU-FOOD-100");
        assertThat(response.stockQuantity()).isEqualTo(20);
        assertThat(response.isLowStock()).isFalse();
        verify(supplyRepository, times(1)).save(any(Supply.class));
    }

    @Test
    @DisplayName("Should auto-generate SKU when SKU is not provided")
    void testCreateSupplyAutoSku() {
        SupplyCreateRequest request = new SupplyCreateRequest(
                null,
                "Cat Feather Wand",
                SupplyCategory.TOYS,
                new BigDecimal("9.99"),
                15,
                3,
                "Interactive feather toy",
                null
        );

        when(supplyRepository.existsBySku(anyString())).thenReturn(false);
        when(supplyRepository.save(any(Supply.class))).thenAnswer(inv -> {
            Supply s = inv.getArgument(0);
            s.setId(2L);
            return s;
        });

        SupplyResponseDTO response = supplyService.createSupply(request);

        assertThat(response).isNotNull();
        assertThat(response.sku()).startsWith("SKU-TOY-");
        verify(supplyRepository, times(1)).save(any(Supply.class));
    }

    @Test
    @DisplayName("Should reject duplicate SKU on creation")
    void testCreateSupplyDuplicateSku() {
        SupplyCreateRequest request = new SupplyCreateRequest(
                "SKU-FOOD-100",
                "Duplicate Kibble",
                SupplyCategory.FOOD,
                new BigDecimal("30.00"),
                10,
                5,
                null,
                null
        );

        when(supplyRepository.existsBySku("SKU-FOOD-100")).thenReturn(true);

        assertThatThrownBy(() -> supplyService.createSupply(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("SKU 'SKU-FOOD-100' already exists");

        verify(supplyRepository, never()).save(any(Supply.class));
    }

    @Test
    @DisplayName("Should adjust stock positively and maintain active status")
    void testAdjustStockPositive() {
        when(supplyRepository.findById(1L)).thenReturn(Optional.of(sampleSupply));
        when(supplyRepository.save(any(Supply.class))).thenAnswer(inv -> inv.getArgument(0));

        SupplyResponseDTO response = supplyService.adjustStock(1L, 10, "Restock batch");

        assertThat(response.stockQuantity()).isEqualTo(30);
        assertThat(response.status()).isEqualTo(SupplyStatus.ACTIVE);
    }

    @Test
    @DisplayName("Should adjust stock to zero and automatically transition to OUT_OF_STOCK")
    void testAdjustStockToZero() {
        when(supplyRepository.findById(1L)).thenReturn(Optional.of(sampleSupply));
        when(supplyRepository.save(any(Supply.class))).thenAnswer(inv -> inv.getArgument(0));

        SupplyResponseDTO response = supplyService.adjustStock(1L, -20, "Sold out");

        assertThat(response.stockQuantity()).isEqualTo(0);
        assertThat(response.status()).isEqualTo(SupplyStatus.OUT_OF_STOCK);
        assertThat(response.isOutOfStock()).isTrue();
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when adjustment results in negative stock")
    void testAdjustStockNegativeResult() {
        when(supplyRepository.findById(1L)).thenReturn(Optional.of(sampleSupply));

        assertThatThrownBy(() -> supplyService.adjustStock(1L, -25, "Oversell"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("negative inventory");

        verify(supplyRepository, never()).save(any(Supply.class));
    }

    @Test
    @DisplayName("Should delete supply and clean up media file")
    void testDeleteSupply() {
        when(supplyRepository.findById(1L)).thenReturn(Optional.of(sampleSupply));

        supplyService.deleteSupply(1L);

        verify(storageService, times(1)).delete("kibble.jpg");
        verify(supplyRepository, times(1)).delete(sampleSupply);
    }
}
