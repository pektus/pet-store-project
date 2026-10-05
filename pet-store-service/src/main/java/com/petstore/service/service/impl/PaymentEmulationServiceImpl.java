package com.petstore.service.service.impl;

import com.petstore.domain.dto.PaymentRequest;
import com.petstore.domain.dto.PaymentResult;
import com.petstore.domain.enums.CardBrand;
import com.petstore.service.service.PaymentEmulationService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class PaymentEmulationServiceImpl implements PaymentEmulationService {

    private static final Pattern NUMERIC_PATTERN = Pattern.compile("^[0-9]+$");

    @Override
    public PaymentResult processPayment(PaymentRequest request, BigDecimal amount) {
        if (request == null) {
            return PaymentResult.failure("Payment details missing", CardBrand.UNKNOWN, "0000");
        }

        String rawCard = request.getCardNumber() != null ? request.getCardNumber() : "";
        String cleanedCard = rawCard.replaceAll("[\\s-]+", "");

        String lastFour = cleanedCard.length() >= 4
                ? cleanedCard.substring(cleanedCard.length() - 4)
                : (cleanedCard.isEmpty() ? "0000" : cleanedCard);

        CardBrand brand = detectBrand(cleanedCard);

        // Basic numeric check
        if (cleanedCard.isEmpty() || !NUMERIC_PATTERN.matcher(cleanedCard).matches()) {
            return PaymentResult.failure("Invalid card number format", brand, lastFour);
        }

        // Length validation based on brand
        if (brand == CardBrand.AMEX) {
            if (cleanedCard.length() != 15) {
                return PaymentResult.failure("American Express card must be 15 digits", brand, lastFour);
            }
        } else {
            if (cleanedCard.length() < 13 || cleanedCard.length() > 19) {
                return PaymentResult.failure("Card number length must be between 13 and 19 digits", brand, lastFour);
            }
        }

        // Expiry Date Validation
        int expMonth;
        int expYear;
        try {
            expMonth = Integer.parseInt(request.getExpiryMonth());
            expYear = Integer.parseInt(request.getExpiryYear());
            if (expYear < 100) {
                expYear += 2000;
            }
        } catch (NumberFormatException e) {
            return PaymentResult.failure("Invalid expiration date format", brand, lastFour);
        }

        if (expMonth < 1 || expMonth > 12) {
            return PaymentResult.failure("Invalid expiration month (must be 01-12)", brand, lastFour);
        }

        YearMonth cardExpiry = YearMonth.of(expYear, expMonth);
        YearMonth currentMonth = YearMonth.now();
        if (cardExpiry.isBefore(currentMonth)) {
            return PaymentResult.failure("Card has expired", brand, lastFour);
        }

        // CVV Validation
        String cvv = request.getCvv() != null ? request.getCvv().trim() : "";
        if (!NUMERIC_PATTERN.matcher(cvv).matches()) {
            return PaymentResult.failure("CVV must contain numbers only", brand, lastFour);
        }
        if (brand == CardBrand.AMEX) {
            if (cvv.length() != 4) {
                return PaymentResult.failure("American Express requires a 4-digit CVV", brand, lastFour);
            }
        } else {
            if (cvv.length() != 3 && cvv.length() != 4) {
                return PaymentResult.failure("CVV must be 3 or 4 digits", brand, lastFour);
            }
        }

        // Decline Simulation Triggers (Q-S5.1 Sandbox convention)
        if (cleanedCard.endsWith("0002")) {
            return PaymentResult.failure("Card Declined: Insufficient Funds", brand, lastFour);
        }
        if (cleanedCard.endsWith("0004")) {
            return PaymentResult.failure("Card Declined: Card Expired", brand, lastFour);
        }
        if (cleanedCard.endsWith("0005")) {
            return PaymentResult.failure("Card Declined: Suspected Fraudulent Card", brand, lastFour);
        }

        // Luhn Algorithm Check
        if (!passesLuhn(cleanedCard)) {
            return PaymentResult.failure("Invalid card number (checksum validation failed)", brand, lastFour);
        }

        // Successful Payment Authorization
        String txnId = "TXN-EMUL-" + UUID.randomUUID().toString().substring(0, 18).toUpperCase();
        return PaymentResult.success(txnId, brand, lastFour);
    }

    public static CardBrand detectBrand(String cardNumber) {
        if (cardNumber == null || cardNumber.isEmpty()) {
            return CardBrand.UNKNOWN;
        }

        if (cardNumber.startsWith("4")) {
            return CardBrand.VISA;
        }

        if (cardNumber.startsWith("34") || cardNumber.startsWith("37")) {
            return CardBrand.AMEX;
        }

        if (cardNumber.startsWith("6011") || cardNumber.startsWith("65")) {
            return CardBrand.DISCOVER;
        }

        try {
            int prefix2 = Integer.parseInt(cardNumber.substring(0, Math.min(2, cardNumber.length())));
            if (prefix2 >= 51 && prefix2 <= 55) {
                return CardBrand.MASTERCARD;
            }

            if (cardNumber.length() >= 4) {
                int prefix4 = Integer.parseInt(cardNumber.substring(0, 4));
                if (prefix4 >= 2221 && prefix4 <= 2720) {
                    return CardBrand.MASTERCARD;
                }
            }
        } catch (NumberFormatException ignored) {
        }

        return CardBrand.UNKNOWN;
    }

    public static boolean passesLuhn(String cardNumber) {
        int sum = 0;
        boolean alternate = false;
        for (int i = cardNumber.length() - 1; i >= 0; i--) {
            int n = cardNumber.charAt(i) - '0';
            if (alternate) {
                n *= 2;
                if (n > 9) {
                    n = (n % 10) + 1;
                }
            }
            sum += n;
            alternate = !alternate;
        }
        return (sum % 10 == 0);
    }
}
