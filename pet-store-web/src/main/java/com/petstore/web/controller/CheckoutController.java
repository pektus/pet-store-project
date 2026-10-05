package com.petstore.web.controller;

import com.petstore.domain.dto.CheckoutQuoteDTO;
import com.petstore.domain.dto.CheckoutRequest;
import com.petstore.domain.dto.OrderResponseDTO;
import com.petstore.domain.entity.AppUser;
import com.petstore.service.exception.ResourceNotFoundException;
import com.petstore.service.repository.UserRepository;
import com.petstore.service.service.CheckoutService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final UserRepository userRepository;

    public CheckoutController(CheckoutService checkoutService, UserRepository userRepository) {
        this.checkoutService = checkoutService;
        this.userRepository = userRepository;
    }

    @GetMapping("/quote")
    public ResponseEntity<CheckoutQuoteDTO> getQuote(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        AppUser user = resolveUser(principal);
        CheckoutQuoteDTO quote = checkoutService.getCheckoutQuote(user);
        return ResponseEntity.ok(quote);
    }

    @PostMapping
    public ResponseEntity<OrderResponseDTO> processCheckout(
            @Valid @RequestBody CheckoutRequest request,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        AppUser user = resolveUser(principal);
        OrderResponseDTO order = checkoutService.processCheckout(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    private AppUser resolveUser(Principal principal) {
        return userRepository.findByUsernameOrEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found: " + principal.getName()));
    }
}
