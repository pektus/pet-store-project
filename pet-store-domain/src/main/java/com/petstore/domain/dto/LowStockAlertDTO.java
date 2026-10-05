package com.petstore.domain.dto;

import java.math.BigDecimal;

public class LowStockAlertDTO {

    private String sku;
    private String name;
    private int stockQuantity;
    private int lowStockThreshold;
    private BigDecimal unitPrice;

    public LowStockAlertDTO() {
    }

    public LowStockAlertDTO(String sku, String name, int stockQuantity, int lowStockThreshold, BigDecimal unitPrice) {
        this.sku = sku;
        this.name = name;
        this.stockQuantity = stockQuantity;
        this.lowStockThreshold = lowStockThreshold;
        this.unitPrice = unitPrice;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(int stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public int getLowStockThreshold() {
        return lowStockThreshold;
    }

    public void setLowStockThreshold(int lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }
}
