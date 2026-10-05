package com.petstore.domain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

public class CheckoutQuoteDTO {

    private BigDecimal subtotal;
    private BigDecimal shippingAmount;
    private boolean isFreeShipping;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private int totalItems;
    private boolean hasPet;

    public CheckoutQuoteDTO() {
    }

    public CheckoutQuoteDTO(BigDecimal subtotal, BigDecimal shippingAmount, boolean isFreeShipping,
                            BigDecimal taxAmount, BigDecimal totalAmount, int totalItems, boolean hasPet) {
        this.subtotal = subtotal;
        this.shippingAmount = shippingAmount;
        this.isFreeShipping = isFreeShipping;
        this.taxAmount = taxAmount;
        this.totalAmount = totalAmount;
        this.totalItems = totalItems;
        this.hasPet = hasPet;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getShippingAmount() {
        return shippingAmount;
    }

    public void setShippingAmount(BigDecimal shippingAmount) {
        this.shippingAmount = shippingAmount;
    }

    @JsonProperty("isFreeShipping")
    public boolean isFreeShipping() {
        return isFreeShipping;
    }

    @JsonProperty("isFreeShipping")
    public void setFreeShipping(boolean freeShipping) {
        this.isFreeShipping = freeShipping;
    }

    @JsonProperty("freeShipping")
    public boolean getFreeShipping() {
        return isFreeShipping;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public int getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(int totalItems) {
        this.totalItems = totalItems;
    }

    public boolean isHasPet() {
        return hasPet;
    }

    public void setHasPet(boolean hasPet) {
        this.hasPet = hasPet;
    }
}
