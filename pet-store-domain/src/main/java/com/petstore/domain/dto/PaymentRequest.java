package com.petstore.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class PaymentRequest {

    @NotBlank(message = "Cardholder name is required")
    private String cardholderName;

    @NotBlank(message = "Card number is required")
    private String cardNumber;

    @NotBlank(message = "Expiry month is required (MM)")
    @Pattern(regexp = "^(0[1-9]|1[0-2])$", message = "Expiry month must be in format MM (01-12)")
    private String expiryMonth;

    @NotBlank(message = "Expiry year is required (YY)")
    @Pattern(regexp = "^[0-9]{2}$", message = "Expiry year must be 2 digits (e.g. 28)")
    private String expiryYear;

    @NotBlank(message = "CVV security code is required")
    @Pattern(regexp = "^[0-9]{3,4}$", message = "CVV must be 3 or 4 digits")
    private String cvv;

    public PaymentRequest() {
    }

    public PaymentRequest(String cardholderName, String cardNumber, String expiryMonth, String expiryYear, String cvv) {
        this.cardholderName = cardholderName;
        this.cardNumber = cardNumber;
        this.expiryMonth = expiryMonth;
        this.expiryYear = expiryYear;
        this.cvv = cvv;
    }

    public String getCardholderName() {
        return cardholderName;
    }

    public void setCardholderName(String cardholderName) {
        this.cardholderName = cardholderName;
    }

    public String getCardNumber() {
        return cardNumber;
    }

    public void setCardNumber(String cardNumber) {
        this.cardNumber = cardNumber;
    }

    public String getExpiryMonth() {
        return expiryMonth;
    }

    public void setExpiryMonth(String expiryMonth) {
        this.expiryMonth = expiryMonth;
    }

    public String getExpiryYear() {
        return expiryYear;
    }

    public void setExpiryYear(String expiryYear) {
        this.expiryYear = expiryYear;
    }

    public String getCvv() {
        return cvv;
    }

    public void setCvv(String cvv) {
        this.cvv = cvv;
    }
}
