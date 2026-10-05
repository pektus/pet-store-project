package com.petstore.domain.dto;

import com.petstore.domain.enums.CardBrand;

public class PaymentResult {

    private boolean successful;
    private String transactionId;
    private CardBrand cardBrand;
    private String cardLastFour;
    private String errorMessage;

    public PaymentResult() {
    }

    public static PaymentResult success(String transactionId, CardBrand cardBrand, String cardLastFour) {
        PaymentResult res = new PaymentResult();
        res.successful = true;
        res.transactionId = transactionId;
        res.cardBrand = cardBrand;
        res.cardLastFour = cardLastFour;
        return res;
    }

    public static PaymentResult failure(String errorMessage, CardBrand cardBrand, String cardLastFour) {
        PaymentResult res = new PaymentResult();
        res.successful = false;
        res.errorMessage = errorMessage;
        res.cardBrand = cardBrand;
        res.cardLastFour = cardLastFour;
        return res;
    }

    public boolean isSuccessful() {
        return successful;
    }

    public void setSuccessful(boolean successful) {
        this.successful = successful;
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

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
