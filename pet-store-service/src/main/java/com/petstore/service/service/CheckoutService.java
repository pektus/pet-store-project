package com.petstore.service.service;

import com.petstore.domain.dto.CheckoutQuoteDTO;
import com.petstore.domain.dto.CheckoutRequest;
import com.petstore.domain.dto.OrderResponseDTO;
import com.petstore.domain.entity.AppUser;

public interface CheckoutService {

    CheckoutQuoteDTO getCheckoutQuote(AppUser user);

    OrderResponseDTO processCheckout(AppUser user, CheckoutRequest request);
}
