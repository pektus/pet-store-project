package com.petstore.service.service;

import com.petstore.domain.dto.InventoryReportDTO;
import com.petstore.domain.dto.SalesReportDTO;
import com.petstore.domain.enums.SalesPeriod;

public interface AnalyticsReportService {

    SalesReportDTO getSalesReport(SalesPeriod period);

    InventoryReportDTO getInventoryReport();

    String generateSalesCsv(SalesPeriod period);

    String generateInventoryCsv();
}
