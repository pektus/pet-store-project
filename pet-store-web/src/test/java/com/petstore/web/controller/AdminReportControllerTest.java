package com.petstore.web.controller;

import com.petstore.domain.dto.InventoryReportDTO;
import com.petstore.domain.dto.SalesReportDTO;
import com.petstore.domain.enums.SalesPeriod;
import com.petstore.service.service.AnalyticsReportService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminReportControllerTest {

    @Mock
    private AnalyticsReportService reportService;

    @InjectMocks
    private AdminReportController controller;

    @Test
    void getSalesReport_returnsOk() {
        SalesReportDTO dto = new SalesReportDTO(
                SalesPeriod.DAY,
                new BigDecimal("500.00"),
                BigDecimal.ZERO,
                new BigDecimal("500.00"),
                5,
                new BigDecimal("100.00"),
                2,
                6,
                List.of()
        );
        when(reportService.getSalesReport(SalesPeriod.DAY)).thenReturn(dto);

        ResponseEntity<SalesReportDTO> response = controller.getSalesReport(SalesPeriod.DAY);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getNetRevenue()).isEqualByComparingTo("500.00");
    }

    @Test
    void getInventoryReport_returnsOk() {
        InventoryReportDTO dto = new InventoryReportDTO(
                10, 8, 2, 5, 4, 1, 0, 100, new BigDecimal("2500.00"), List.of(), List.of()
        );
        when(reportService.getInventoryReport()).thenReturn(dto);

        ResponseEntity<InventoryReportDTO> response = controller.getInventoryReport();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getTotalPets()).isEqualTo(10);
    }

    @Test
    void exportSalesCsv_returnsCsvAttachment() {
        String csvContent = "Period,Gross Revenue\r\n2026-10-05,500.00\r\n";
        when(reportService.generateSalesCsv(SalesPeriod.DAY)).thenReturn(csvContent);

        ResponseEntity<byte[]> response = controller.exportSalesCsv(SalesPeriod.DAY);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION)).contains("attachment; filename=\"sales-report-day-");
        assertThat(new String(response.getBody(), StandardCharsets.UTF_8)).isEqualTo(csvContent);
    }

    @Test
    void exportInventoryCsv_returnsCsvAttachment() {
        String csvContent = "SKU,Name\r\nFOOD-01,Kibble\r\n";
        when(reportService.generateInventoryCsv()).thenReturn(csvContent);

        ResponseEntity<byte[]> response = controller.exportInventoryCsv();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION)).contains("attachment; filename=\"inventory-report-");
        assertThat(new String(response.getBody(), StandardCharsets.UTF_8)).isEqualTo(csvContent);
    }
}
