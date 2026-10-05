package com.petstore.service.service.impl;

import com.petstore.domain.dto.*;
import com.petstore.domain.entity.AccountingLedger;
import com.petstore.domain.entity.Order;
import com.petstore.domain.entity.OrderItem;
import com.petstore.domain.entity.Pet;
import com.petstore.domain.entity.Supply;
import com.petstore.domain.enums.*;
import com.petstore.service.repository.AccountingLedgerRepository;
import com.petstore.service.repository.OrderRepository;
import com.petstore.service.repository.PetRepository;
import com.petstore.service.repository.SupplyRepository;
import com.petstore.service.service.AnalyticsReportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.IsoFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AnalyticsReportServiceImpl implements AnalyticsReportService {

    private final AccountingLedgerRepository ledgerRepository;
    private final OrderRepository orderRepository;
    private final PetRepository petRepository;
    private final SupplyRepository supplyRepository;

    public AnalyticsReportServiceImpl(AccountingLedgerRepository ledgerRepository,
                                      OrderRepository orderRepository,
                                      PetRepository petRepository,
                                      SupplyRepository supplyRepository) {
        this.ledgerRepository = ledgerRepository;
        this.orderRepository = orderRepository;
        this.petRepository = petRepository;
        this.supplyRepository = supplyRepository;
    }

    @Override
    public SalesReportDTO getSalesReport(SalesPeriod period) {
        Instant now = Instant.now();
        Instant start = calculateStartDate(period, now);

        List<AccountingLedger> ledgerEntries = ledgerRepository.findByCreatedAtBetweenOrderByCreatedAtAsc(start, now);
        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getCreatedAt() != null && !o.getCreatedAt().isBefore(start) && !o.getCreatedAt().isAfter(now))
                .toList();

        Map<String, AggregatedPeriod> periodMap = new TreeMap<>();

        // Group Ledger Entries (Gross Revenue & Refunds)
        for (AccountingLedger ledger : ledgerEntries) {
            String label = formatPeriodLabel(ledger.getCreatedAt(), period);
            AggregatedPeriod agg = periodMap.computeIfAbsent(label, k -> new AggregatedPeriod(label));
            if (ledger.getTransactionType() == LedgerTransactionType.PAYMENT) {
                agg.grossRevenue = agg.grossRevenue.add(ledger.getAmount());
            } else if (ledger.getTransactionType() == LedgerTransactionType.REFUND) {
                agg.refundAmount = agg.refundAmount.add(ledger.getAmount());
            }
        }

        // Group Orders (Orders count, pets adopted, supplies sold)
        for (Order order : orders) {
            String label = formatPeriodLabel(order.getCreatedAt(), period);
            AggregatedPeriod agg = periodMap.computeIfAbsent(label, k -> new AggregatedPeriod(label));
            agg.ordersCount++;

            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.getItemType() == CartItemType.PET) {
                        agg.petsCount += item.getQuantity();
                    } else if (item.getItemType() == CartItemType.SUPPLY) {
                        agg.suppliesCount += item.getQuantity();
                    }
                }
            }
        }

        BigDecimal totalGross = BigDecimal.ZERO;
        BigDecimal totalRefund = BigDecimal.ZERO;
        long totalOrders = 0;
        long totalPets = 0;
        long totalSupplies = 0;

        List<SalesDataPointDTO> dataPoints = new ArrayList<>();
        for (AggregatedPeriod agg : periodMap.values()) {
            BigDecimal net = agg.grossRevenue.subtract(agg.refundAmount);
            dataPoints.add(new SalesDataPointDTO(
                    agg.label,
                    agg.grossRevenue.setScale(2, RoundingMode.HALF_UP),
                    agg.refundAmount.setScale(2, RoundingMode.HALF_UP),
                    net.setScale(2, RoundingMode.HALF_UP),
                    agg.ordersCount,
                    agg.petsCount,
                    agg.suppliesCount
            ));

            totalGross = totalGross.add(agg.grossRevenue);
            totalRefund = totalRefund.add(agg.refundAmount);
            totalOrders += agg.ordersCount;
            totalPets += agg.petsCount;
            totalSupplies += agg.suppliesCount;
        }

        BigDecimal netTotal = totalGross.subtract(totalRefund).setScale(2, RoundingMode.HALF_UP);
        BigDecimal aov = totalOrders > 0
                ? totalGross.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        return new SalesReportDTO(
                period,
                totalGross.setScale(2, RoundingMode.HALF_UP),
                totalRefund.setScale(2, RoundingMode.HALF_UP),
                netTotal,
                totalOrders,
                aov,
                totalPets,
                totalSupplies,
                dataPoints
        );
    }

    @Override
    public InventoryReportDTO getInventoryReport() {
        List<Pet> allPets = petRepository.findAll();
        long totalPets = allPets.size();
        long availablePets = allPets.stream().filter(p -> p.getStatus() == PetStatus.AVAILABLE).count();
        long adoptedPets = allPets.stream().filter(p -> p.getStatus() == PetStatus.ADOPTED).count();

        // Pet taxonomy breakdown by Category
        Map<String, List<Pet>> petsByCategory = allPets.stream()
                .collect(Collectors.groupingBy(p -> p.getCategory() != null ? p.getCategory().getName() : "Uncategorized"));

        List<PetCategoryBreakdownDTO> petBreakdowns = new ArrayList<>();
        for (Map.Entry<String, List<Pet>> entry : petsByCategory.entrySet()) {
            long total = entry.getValue().size();
            long available = entry.getValue().stream().filter(p -> p.getStatus() == PetStatus.AVAILABLE).count();
            long adopted = entry.getValue().stream().filter(p -> p.getStatus() == PetStatus.ADOPTED).count();
            double rate = total > 0 ? (double) adopted / total * 100.0 : 0.0;
            petBreakdowns.add(new PetCategoryBreakdownDTO(entry.getKey(), total, available, adopted, Math.round(rate * 10.0) / 10.0));
        }

        // Supplies breakdown
        List<Supply> allSupplies = supplyRepository.findAll();
        long totalSupplySkus = allSupplies.size();
        long inStockCount = 0;
        long lowStockCount = 0;
        long outOfStockCount = 0;
        long totalStockUnits = 0;
        BigDecimal totalValuation = BigDecimal.ZERO;
        List<LowStockAlertDTO> lowStockAlerts = new ArrayList<>();

        for (Supply s : allSupplies) {
            int qty = s.getStockQuantity() != null ? s.getStockQuantity() : 0;
            int threshold = s.getLowStockThreshold() != null ? s.getLowStockThreshold() : 5;
            totalStockUnits += qty;

            BigDecimal val = s.getPrice().multiply(BigDecimal.valueOf(qty));
            totalValuation = totalValuation.add(val);

            if (qty <= 0 || s.getStatus() == SupplyStatus.OUT_OF_STOCK) {
                outOfStockCount++;
                lowStockAlerts.add(new LowStockAlertDTO(s.getSku(), s.getName(), qty, threshold, s.getPrice()));
            } else if (qty <= threshold) {
                lowStockCount++;
                lowStockAlerts.add(new LowStockAlertDTO(s.getSku(), s.getName(), qty, threshold, s.getPrice()));
            } else {
                inStockCount++;
            }
        }

        return new InventoryReportDTO(
                totalPets,
                availablePets,
                adoptedPets,
                totalSupplySkus,
                inStockCount,
                lowStockCount,
                outOfStockCount,
                totalStockUnits,
                totalValuation.setScale(2, RoundingMode.HALF_UP),
                lowStockAlerts,
                petBreakdowns
        );
    }

    @Override
    public String generateSalesCsv(SalesPeriod period) {
        SalesReportDTO report = getSalesReport(period);
        StringBuilder sb = new StringBuilder();
        sb.append("Period,Gross Revenue,Refund Amount,Net Revenue,Orders Count,Pets Adopted,Supplies Sold\r\n");

        for (SalesDataPointDTO dp : report.getDataPoints()) {
            sb.append(escapeCsv(dp.getPeriodLabel())).append(",")
                    .append(dp.getGrossRevenue()).append(",")
                    .append(dp.getRefundAmount()).append(",")
                    .append(dp.getNetRevenue()).append(",")
                    .append(dp.getOrdersCount()).append(",")
                    .append(dp.getPetsCount()).append(",")
                    .append(dp.getSuppliesCount()).append("\r\n");
        }

        // Summary row
        sb.append("TOTAL,")
                .append(report.getGrossRevenue()).append(",")
                .append(report.getRefundAmount()).append(",")
                .append(report.getNetRevenue()).append(",")
                .append(report.getTotalOrders()).append(",")
                .append(report.getPetsAdopted()).append(",")
                .append(report.getSuppliesSold()).append("\r\n");

        return sb.toString();
    }

    @Override
    public String generateInventoryCsv() {
        InventoryReportDTO report = getInventoryReport();
        List<Supply> allSupplies = supplyRepository.findAll();

        StringBuilder sb = new StringBuilder();
        sb.append("SKU,Name,Category,Unit Price,Stock Quantity,Low Stock Threshold,Valuation,Status\r\n");

        for (Supply s : allSupplies) {
            int qty = s.getStockQuantity() != null ? s.getStockQuantity() : 0;
            BigDecimal val = s.getPrice().multiply(BigDecimal.valueOf(qty)).setScale(2, RoundingMode.HALF_UP);
            sb.append(escapeCsv(s.getSku())).append(",")
                    .append(escapeCsv(s.getName())).append(",")
                    .append(escapeCsv(s.getCategory() != null ? s.getCategory().name() : "N/A")).append(",")
                    .append(s.getPrice()).append(",")
                    .append(qty).append(",")
                    .append(s.getLowStockThreshold()).append(",")
                    .append(val).append(",")
                    .append(s.getStatus()).append("\r\n");
        }

        return sb.toString();
    }

    private Instant calculateStartDate(SalesPeriod period, Instant now) {
        ZonedDateTime zdt = now.atZone(ZoneOffset.UTC);
        return switch (period) {
            case DAY -> zdt.minusDays(30).toInstant();
            case WEEK -> zdt.minusWeeks(12).toInstant();
            case MONTH -> zdt.minusMonths(12).toInstant();
        };
    }

    private String formatPeriodLabel(Instant instant, SalesPeriod period) {
        if (instant == null) return "Unknown";
        ZonedDateTime zdt = instant.atZone(ZoneOffset.UTC);
        return switch (period) {
            case DAY -> zdt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            case WEEK -> zdt.getYear() + "-W" + String.format("%02d", zdt.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR));
            case MONTH -> zdt.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        };
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private static class AggregatedPeriod {
        final String label;
        BigDecimal grossRevenue = BigDecimal.ZERO;
        BigDecimal refundAmount = BigDecimal.ZERO;
        long ordersCount = 0;
        long petsCount = 0;
        long suppliesCount = 0;

        AggregatedPeriod(String label) {
            this.label = label;
        }
    }
}
