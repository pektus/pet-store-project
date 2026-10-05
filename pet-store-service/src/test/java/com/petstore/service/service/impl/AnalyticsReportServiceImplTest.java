package com.petstore.service.service.impl;

import com.petstore.domain.dto.InventoryReportDTO;
import com.petstore.domain.dto.SalesReportDTO;
import com.petstore.domain.entity.*;
import com.petstore.domain.enums.*;
import com.petstore.service.repository.AccountingLedgerRepository;
import com.petstore.service.repository.OrderRepository;
import com.petstore.service.repository.PetRepository;
import com.petstore.service.repository.SupplyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsReportServiceImplTest {

    @Mock
    private AccountingLedgerRepository ledgerRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PetRepository petRepository;

    @Mock
    private SupplyRepository supplyRepository;

    @InjectMocks
    private AnalyticsReportServiceImpl reportService;

    private AccountingLedger ledgerPayment;
    private AccountingLedger ledgerRefund;
    private Order order;
    private Pet pet;
    private Supply supply;

    @BeforeEach
    void setUp() {
        order = new Order();
        order.setId(1L);
        order.setOrderNumber("ORD-100");
        order.setTotalAmount(new BigDecimal("150.00"));
        order.setCreatedAt(Instant.now());

        Category cat = new Category("Dogs", "Canine", 1);
        pet = new Pet(cat, "Max", "Labrador", 2, new BigDecimal("100.00"), PetStatus.AVAILABLE, "Good dog", null);
        pet.setId(10L);

        supply = new Supply("FOOD-01", "Kibble", SupplyCategory.FOOD, new BigDecimal("25.00"), 4, 5, SupplyStatus.ACTIVE, "Dog food", null);
        supply.setId(20L);

        OrderItem petItem = new OrderItem(order, CartItemType.PET, pet, null, "Max", "Labrador", new BigDecimal("100.00"), 1, new BigDecimal("100.00"), null);
        OrderItem supplyItem = new OrderItem(order, CartItemType.SUPPLY, null, supply, "Kibble", "FOOD-01", new BigDecimal("25.00"), 2, new BigDecimal("50.00"), null);

        order.addItem(petItem);
        order.addItem(supplyItem);

        ledgerPayment = new AccountingLedger(LedgerTransactionType.PAYMENT, order, "ORD-100", new BigDecimal("150.00"), PaymentMethod.CREDIT_CARD, CardBrand.VISA, "4242", "TXN-1", "Payment");
        ledgerPayment.setCreatedAt(Instant.now());

        ledgerRefund = new AccountingLedger(LedgerTransactionType.REFUND, order, "ORD-100", new BigDecimal("50.00"), PaymentMethod.CREDIT_CARD, CardBrand.VISA, "4242", "REF-1", "Refund");
        ledgerRefund.setCreatedAt(Instant.now());
    }

    @Test
    void getSalesReport_aggregatesRevenueAndItems() {
        when(ledgerRepository.findByCreatedAtBetweenOrderByCreatedAtAsc(any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(ledgerPayment, ledgerRefund));
        when(orderRepository.findAll()).thenReturn(List.of(order));

        SalesReportDTO report = reportService.getSalesReport(SalesPeriod.DAY);

        assertThat(report.getGrossRevenue()).isEqualByComparingTo("150.00");
        assertThat(report.getRefundAmount()).isEqualByComparingTo("50.00");
        assertThat(report.getNetRevenue()).isEqualByComparingTo("100.00");
        assertThat(report.getTotalOrders()).isEqualTo(1);
        assertThat(report.getPetsAdopted()).isEqualTo(1);
        assertThat(report.getSuppliesSold()).isEqualTo(2);
        assertThat(report.getDataPoints()).isNotEmpty();
    }

    @Test
    void getInventoryReport_summarizesPetsAndSupplies() {
        when(petRepository.findAll()).thenReturn(List.of(pet));
        when(supplyRepository.findAll()).thenReturn(List.of(supply));

        InventoryReportDTO report = reportService.getInventoryReport();

        assertThat(report.getTotalPets()).isEqualTo(1);
        assertThat(report.getAvailablePets()).isEqualTo(1);
        assertThat(report.getAdoptedPets()).isEqualTo(0);
        assertThat(report.getTotalSupplySkus()).isEqualTo(1);
        assertThat(report.getLowStockSuppliesCount()).isEqualTo(1);
        assertThat(report.getTotalSuppliesStockUnits()).isEqualTo(4);
        assertThat(report.getTotalSuppliesValuation()).isEqualByComparingTo("100.00"); // 4 * 25.00
        assertThat(report.getLowStockAlerts()).hasSize(1);
        assertThat(report.getPetCategoryBreakdown()).hasSize(1);
    }

    @Test
    void generateSalesCsv_returnsValidCsvHeaderAndRows() {
        when(ledgerRepository.findByCreatedAtBetweenOrderByCreatedAtAsc(any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(ledgerPayment));
        when(orderRepository.findAll()).thenReturn(List.of(order));

        String csv = reportService.generateSalesCsv(SalesPeriod.DAY);

        assertThat(csv).contains("Period,Gross Revenue,Refund Amount,Net Revenue,Orders Count,Pets Adopted,Supplies Sold");
        assertThat(csv).contains("150.00");
        assertThat(csv).contains("TOTAL");
    }

    @Test
    void generateInventoryCsv_returnsValidCsvHeaderAndRows() {
        when(petRepository.findAll()).thenReturn(List.of(pet));
        when(supplyRepository.findAll()).thenReturn(List.of(supply));

        String csv = reportService.generateInventoryCsv();

        assertThat(csv).contains("SKU,Name,Category,Unit Price,Stock Quantity,Low Stock Threshold,Valuation,Status");
        assertThat(csv).contains("FOOD-01,Kibble");
    }
}
