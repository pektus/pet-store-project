package com.petstore.service.service;

import com.petstore.domain.dto.PaymentRequest;
import com.petstore.domain.dto.PaymentResult;

import java.math.BigDecimal;

public interface PaymentEmulationService {

    PaymentResult processPayment(PaymentRequest request, BigDecimal amount);
}
