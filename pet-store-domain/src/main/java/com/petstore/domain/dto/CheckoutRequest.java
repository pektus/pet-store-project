package com.petstore.domain.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CheckoutRequest {

    @NotBlank(message = "Recipient name is required")
    private String recipientName;

    @NotBlank(message = "Recipient phone is required")
    private String recipientPhone;

    @NotBlank(message = "Shipping address line 1 is required")
    private String shippingAddressLine1;

    private String shippingAddressLine2;

    @NotBlank(message = "City is required")
    private String shippingCity;

    @NotBlank(message = "State/Province is required")
    private String shippingState;

    @NotBlank(message = "Postal/ZIP code is required")
    private String shippingPostalCode;

    private String shippingCountry = "United States";

    @NotNull(message = "Payment details are required")
    @Valid
    private PaymentRequest payment;

    public CheckoutRequest() {
    }

    public CheckoutRequest(String recipientName, String recipientPhone, String shippingAddressLine1,
                           String shippingAddressLine2, String shippingCity, String shippingState,
                           String shippingPostalCode, String shippingCountry, PaymentRequest payment) {
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.shippingAddressLine1 = shippingAddressLine1;
        this.shippingAddressLine2 = shippingAddressLine2;
        this.shippingCity = shippingCity;
        this.shippingState = shippingState;
        this.shippingPostalCode = shippingPostalCode;
        this.shippingCountry = shippingCountry != null ? shippingCountry : "United States";
        this.payment = payment;
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

    public PaymentRequest getPayment() {
        return payment;
    }

    public void setPayment(PaymentRequest payment) {
        this.payment = payment;
    }
}
