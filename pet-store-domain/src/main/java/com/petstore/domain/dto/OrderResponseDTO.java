package com.petstore.domain.dto;

import com.petstore.domain.enums.CardBrand;
import com.petstore.domain.enums.OrderStatus;
import com.petstore.domain.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class OrderResponseDTO {

    private String orderNumber;
    private OrderStatus status;
    private PaymentStatus paymentStatus;
    private String transactionId;
    private CardBrand cardBrand;
    private String cardLastFour;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal shippingAmount;
    private BigDecimal totalAmount;
    private String recipientName;
    private String recipientPhone;
    private String shippingAddressLine1;
    private String shippingAddressLine2;
    private String shippingCity;
    private String shippingState;
    private String shippingPostalCode;
    private String shippingCountry;
    private List<OrderItemResponseDTO> items = new ArrayList<>();
    private Instant createdAt;

    private String carrier;
    private String trackingNumber;
    private String cancellationReason;
    private Instant cancelledAt;
    private Instant shippedAt;
    private Instant deliveredAt;

    public OrderResponseDTO() {
    }

    public OrderResponseDTO(String orderNumber, OrderStatus status, PaymentStatus paymentStatus,
                            String transactionId, CardBrand cardBrand, String cardLastFour,
                            BigDecimal subtotal, BigDecimal taxAmount, BigDecimal shippingAmount,
                            BigDecimal totalAmount, String recipientName, String recipientPhone,
                            String shippingAddressLine1, String shippingAddressLine2,
                            String shippingCity, String shippingState, String shippingPostalCode,
                            String shippingCountry, List<OrderItemResponseDTO> items,
                            Instant createdAt) {
        this(orderNumber, status, paymentStatus, transactionId, cardBrand, cardLastFour,
             subtotal, taxAmount, shippingAmount, totalAmount, recipientName, recipientPhone,
             shippingAddressLine1, shippingAddressLine2, shippingCity, shippingState,
             shippingPostalCode, shippingCountry, items, createdAt, null, null, null, null, null, null);
    }

    public OrderResponseDTO(String orderNumber, OrderStatus status, PaymentStatus paymentStatus,
                            String transactionId, CardBrand cardBrand, String cardLastFour,
                            BigDecimal subtotal, BigDecimal taxAmount, BigDecimal shippingAmount,
                            BigDecimal totalAmount, String recipientName, String recipientPhone,
                            String shippingAddressLine1, String shippingAddressLine2,
                            String shippingCity, String shippingState, String shippingPostalCode,
                            String shippingCountry, List<OrderItemResponseDTO> items,
                            Instant createdAt, String carrier, String trackingNumber,
                            String cancellationReason, Instant cancelledAt, Instant shippedAt,
                            Instant deliveredAt) {
        this.orderNumber = orderNumber;
        this.status = status;
        this.paymentStatus = paymentStatus;
        this.transactionId = transactionId;
        this.cardBrand = cardBrand;
        this.cardLastFour = cardLastFour;
        this.subtotal = subtotal;
        this.taxAmount = taxAmount;
        this.shippingAmount = shippingAmount;
        this.totalAmount = totalAmount;
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.shippingAddressLine1 = shippingAddressLine1;
        this.shippingAddressLine2 = shippingAddressLine2;
        this.shippingCity = shippingCity;
        this.shippingState = shippingState;
        this.shippingPostalCode = shippingPostalCode;
        this.shippingCountry = shippingCountry;
        this.items = items != null ? items : new ArrayList<>();
        this.createdAt = createdAt;
        this.carrier = carrier;
        this.trackingNumber = trackingNumber;
        this.cancellationReason = cancellationReason;
        this.cancelledAt = cancelledAt;
        this.shippedAt = shippedAt;
        this.deliveredAt = deliveredAt;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public CardBrand getCardBrand() {
        return cardBrand;
    }

    public void setCardBrand(CardBrand cardBrand) {
        this.cardBrand = cardBrand;
    }

    public String getCardLastFour() {
        return cardLastFour;
    }

    public void setCardLastFour(String cardLastFour) {
        this.cardLastFour = cardLastFour;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getShippingAmount() {
        return shippingAmount;
    }

    public void setShippingAmount(BigDecimal shippingAmount) {
        this.shippingAmount = shippingAmount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getRecipientPhone() {
        return recipientPhone;
    }

    public void setRecipientPhone(String recipientPhone) {
        this.recipientPhone = recipientPhone;
    }

    public String getShippingAddressLine1() {
        return shippingAddressLine1;
    }

    public void setShippingAddressLine1(String shippingAddressLine1) {
        this.shippingAddressLine1 = shippingAddressLine1;
    }

    public String getShippingAddressLine2() {
        return shippingAddressLine2;
    }

    public void setShippingAddressLine2(String shippingAddressLine2) {
        this.shippingAddressLine2 = shippingAddressLine2;
    }

    public String getShippingCity() {
        return shippingCity;
    }

    public void setShippingCity(String shippingCity) {
        this.shippingCity = shippingCity;
    }

    public String getShippingState() {
        return shippingState;
    }

    public void setShippingState(String shippingState) {
        this.shippingState = shippingState;
    }

    public String getShippingPostalCode() {
        return shippingPostalCode;
    }

    public void setShippingPostalCode(String shippingPostalCode) {
        this.shippingPostalCode = shippingPostalCode;
    }

    public String getShippingCountry() {
        return shippingCountry;
    }

    public void setShippingCountry(String shippingCountry) {
        this.shippingCountry = shippingCountry;
    }

    public List<OrderItemResponseDTO> getItems() {
        return items;
    }

    public void setItems(List<OrderItemResponseDTO> items) {
        this.items = items;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getCarrier() {
        return carrier;
    }

    public void setCarrier(String carrier) {
        this.carrier = carrier;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public Instant getShippedAt() {
        return shippedAt;
    }

    public void setShippedAt(Instant shippedAt) {
        this.shippedAt = shippedAt;
    }

    public Instant getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(Instant deliveredAt) {
        this.deliveredAt = deliveredAt;
    }
}
