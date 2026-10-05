package com.petstore.domain.dto;

import com.petstore.domain.enums.SalesPeriod;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class SalesReportDTO {

    private SalesPeriod period;
    private BigDecimal grossRevenue = BigDecimal.ZERO;
    private BigDecimal refundAmount = BigDecimal.ZERO;
    private BigDecimal netRevenue = BigDecimal.ZERO;
    private long totalOrders;
    private BigDecimal averageOrderValue = BigDecimal.ZERO;
    private long petsAdopted;
    private long suppliesSold;
    private List<SalesDataPointDTO> dataPoints = new ArrayList<>();

    public SalesReportDTO() {
    }

    public SalesReportDTO(SalesPeriod period, BigDecimal grossRevenue, BigDecimal refundAmount,
                          BigDecimal netRevenue, long totalOrders, BigDecimal averageOrderValue,
                          long petsAdopted, long suppliesSold, List<SalesDataPointDTO> dataPoints) {
        this.period = period;
        this.grossRevenue = grossRevenue != null ? grossRevenue : BigDecimal.ZERO;
        this.refundAmount = refundAmount != null ? refundAmount : BigDecimal.ZERO;
        this.netRevenue = netRevenue != null ? netRevenue : BigDecimal.ZERO;
        this.totalOrders = totalOrders;
        this.averageOrderValue = averageOrderValue != null ? averageOrderValue : BigDecimal.ZERO;
        this.petsAdopted = petsAdopted;
        this.suppliesSold = suppliesSold;
        this.dataPoints = dataPoints != null ? dataPoints : new ArrayList<>();
    }

    public SalesPeriod getPeriod() {
        return period;
    }

    public void setPeriod(SalesPeriod period) {
        this.period = period;
    }

    public BigDecimal getGrossRevenue() {
        return grossRevenue;
    }

    public void setGrossRevenue(BigDecimal grossRevenue) {
        this.grossRevenue = grossRevenue;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(BigDecimal refundAmount) {
        this.refundAmount = refundAmount;
    }

    public BigDecimal getNetRevenue() {
        return netRevenue;
    }

    public void setNetRevenue(BigDecimal netRevenue) {
        this.netRevenue = netRevenue;
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public BigDecimal getAverageOrderValue() {
        return averageOrderValue;
    }

    public void setAverageOrderValue(BigDecimal averageOrderValue) {
        this.averageOrderValue = averageOrderValue;
    }

    public long getPetsAdopted() {
        return petsAdopted;
    }

    public void setPetsAdopted(long petsAdopted) {
        this.petsAdopted = petsAdopted;
    }

    public long getSuppliesSold() {
        return suppliesSold;
    }

    public void setSuppliesSold(long suppliesSold) {
        this.suppliesSold = suppliesSold;
    }

    public List<SalesDataPointDTO> getDataPoints() {
        return dataPoints;
    }

    public void setDataPoints(List<SalesDataPointDTO> dataPoints) {
        this.dataPoints = dataPoints;
    }
}
