package com.petstore.domain.dto;

import java.math.BigDecimal;

public class SalesDataPointDTO {

    private String periodLabel;
    private BigDecimal grossRevenue = BigDecimal.ZERO;
    private BigDecimal refundAmount = BigDecimal.ZERO;
    private BigDecimal netRevenue = BigDecimal.ZERO;
    private long ordersCount;
    private long petsCount;
    private long suppliesCount;

    public SalesDataPointDTO() {
    }

    public SalesDataPointDTO(String periodLabel, BigDecimal grossRevenue, BigDecimal refundAmount,
                             BigDecimal netRevenue, long ordersCount, long petsCount, long suppliesCount) {
        this.periodLabel = periodLabel;
        this.grossRevenue = grossRevenue != null ? grossRevenue : BigDecimal.ZERO;
        this.refundAmount = refundAmount != null ? refundAmount : BigDecimal.ZERO;
        this.netRevenue = netRevenue != null ? netRevenue : BigDecimal.ZERO;
        this.ordersCount = ordersCount;
        this.petsCount = petsCount;
        this.suppliesCount = suppliesCount;
    }

    public String getPeriodLabel() {
        return periodLabel;
    }

    public void setPeriodLabel(String periodLabel) {
        this.periodLabel = periodLabel;
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

    public long getOrdersCount() {
        return ordersCount;
    }

    public void setOrdersCount(long ordersCount) {
        this.ordersCount = ordersCount;
    }

    public long getPetsCount() {
        return petsCount;
    }

    public void setPetsCount(long petsCount) {
        this.petsCount = petsCount;
    }

    public long getSuppliesCount() {
        return suppliesCount;
    }

    public void setSuppliesCount(long suppliesCount) {
        this.suppliesCount = suppliesCount;
    }
}
