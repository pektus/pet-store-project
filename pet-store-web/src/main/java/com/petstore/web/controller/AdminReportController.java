package com.petstore.web.controller;

import com.petstore.domain.dto.InventoryReportDTO;
import com.petstore.domain.dto.SalesReportDTO;
import com.petstore.domain.enums.SalesPeriod;
import com.petstore.service.service.AnalyticsReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final AnalyticsReportService reportService;

    public AdminReportController(AnalyticsReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/sales")
    public ResponseEntity<SalesReportDTO> getSalesReport(
            @RequestParam(defaultValue = "DAY") SalesPeriod period) {
        SalesReportDTO report = reportService.getSalesReport(period);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/inventory")
    public ResponseEntity<InventoryReportDTO> getInventoryReport() {
        InventoryReportDTO report = reportService.getInventoryReport();
        return ResponseEntity.ok(report);
    }

    @GetMapping(value = "/sales/csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportSalesCsv(
            @RequestParam(defaultValue = "DAY") SalesPeriod period) {
        String csv = reportService.generateSalesCsv(period);
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);

        String filename = "sales-report-" + period.name().toLowerCase() + "-" + Instant.now().getEpochSecond() + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }

    @GetMapping(value = "/inventory/csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportInventoryCsv() {
        String csv = reportService.generateInventoryCsv();
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);

        String filename = "inventory-report-" + Instant.now().getEpochSecond() + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }
}
