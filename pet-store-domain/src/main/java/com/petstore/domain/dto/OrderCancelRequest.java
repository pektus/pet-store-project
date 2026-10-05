package com.petstore.domain.dto;

public class OrderCancelRequest {

    private String reason;

    public OrderCancelRequest() {
    }

    public OrderCancelRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
