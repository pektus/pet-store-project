package com.petstore.service.service.impl;

import com.petstore.domain.dto.PaymentRequest;
import com.petstore.domain.dto.PaymentResult;
import com.petstore.domain.enums.CardBrand;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentEmulationServiceImplTest {

    private PaymentEmulationServiceImpl paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentEmulationServiceImpl();
    }

    @Test
    @DisplayName("Should successfully authorize a valid Visa card")
    void processPayment_ValidVisa_Success() {
        // Valid Luhn Visa card: 4000 0012 3456 7899
        PaymentRequest request = new PaymentRequest(
                "Jane Doe",
                "4000 0012 3456 7899",
                "12",
                "30",
                "123"
        );

        PaymentResult result = paymentService.processPayment(request, new BigDecimal("150.00"));

        assertThat(result.isSuccessful()).isTrue();
        assertThat(result.getCardBrand()).isEqualTo(CardBrand.VISA);
        assertThat(result.getCardLastFour()).isEqualTo("7899");
        assertThat(result.getTransactionId()).startsWith("TXN-EMUL-");
    }

    @Test
    @DisplayName("Should detect Mastercard and authorize successfully")
    void processPayment_ValidMastercard_Success() {
        // Valid Luhn Mastercard: 5105 1051 0510 5100
        PaymentRequest request = new PaymentRequest(
                "John Smith",
                "5105 1051 0510 5100",
                "08",
                "29",
                "456"
        );

        PaymentResult result = paymentService.processPayment(request, new BigDecimal("89.99"));

        assertThat(result.isSuccessful()).isTrue();
        assertThat(result.getCardBrand()).isEqualTo(CardBrand.MASTERCARD);
        assertThat(result.getCardLastFour()).isEqualTo("5100");
    }

    @Test
    @DisplayName("Should fail when card number fails Luhn checksum")
    void processPayment_InvalidLuhn_Fails() {
        PaymentRequest request = new PaymentRequest(
                "Jane Doe",
                "4000 0012 3456 7890", // Invalid checksum
                "12",
                "30",
                "123"
        );

        PaymentResult result = paymentService.processPayment(request, new BigDecimal("100.00"));

        assertThat(result.isSuccessful()).isFalse();
        assertThat(result.getErrorMessage()).contains("Invalid card number (checksum validation failed)");
    }

    @Test
    @DisplayName("Should fail when card expiration date is in the past")
    void processPayment_ExpiredDate_Fails() {
        PaymentRequest request = new PaymentRequest(
                "Jane Doe",
                "4000 0012 3456 7899",
                "01",
                "20", // Expired
                "123"
        );

        PaymentResult result = paymentService.processPayment(request, new BigDecimal("100.00"));

        assertThat(result.isSuccessful()).isFalse();
        assertThat(result.getErrorMessage()).contains("Card has expired");
    }

    @Test
    @DisplayName("Should trigger Insufficient Funds decline when card ends in 0002")
    void processPayment_Decline_InsufficientFunds() {
        PaymentRequest request = new PaymentRequest(
                "Jane Doe",
                "4000 0000 0000 0002",
                "12",
                "30",
                "123"
        );

        PaymentResult result = paymentService.processPayment(request, new BigDecimal("100.00"));

        assertThat(result.isSuccessful()).isFalse();
        assertThat(result.getErrorMessage()).contains("Insufficient Funds");
    }

    @Test
    @DisplayName("Should trigger Expired Card decline when card ends in 0004")
    void processPayment_Decline_Expired() {
        PaymentRequest request = new PaymentRequest(
                "Jane Doe",
                "4000 0000 0000 0004",
                "12",
                "30",
                "123"
        );

        PaymentResult result = paymentService.processPayment(request, new BigDecimal("100.00"));

        assertThat(result.isSuccessful()).isFalse();
        assertThat(result.getErrorMessage()).contains("Card Expired");
    }

    @Test
    @DisplayName("Should trigger Fraud Suspected decline when card ends in 0005")
    void processPayment_Decline_Fraud() {
        PaymentRequest request = new PaymentRequest(
                "Jane Doe",
                "4000 0000 0000 0005",
                "12",
                "30",
                "123"
        );

        PaymentResult result = paymentService.processPayment(request, new BigDecimal("100.00"));

        assertThat(result.isSuccessful()).isFalse();
        assertThat(result.getErrorMessage()).contains("Suspected Fraudulent Card");
    }
}
