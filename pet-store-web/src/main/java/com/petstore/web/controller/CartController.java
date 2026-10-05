package com.petstore.web.controller;

import com.petstore.domain.dto.AddToCartRequest;
import com.petstore.domain.dto.CartResponseDTO;
import com.petstore.domain.dto.CartSyncRequest;
import com.petstore.domain.dto.UpdateCartItemRequest;
import com.petstore.domain.entity.AppUser;
import com.petstore.service.repository.UserRepository;
import com.petstore.service.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final UserRepository userRepository;

    public CartController(CartService cartService, UserRepository userRepository) {
        this.cartService = cartService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<CartResponseDTO> getCart(
            @RequestHeader(value = "X-Session-Token", required = false) String sessionToken,
            Principal principal) {
        AppUser user = resolveUser(principal);
        CartResponseDTO cart = cartService.getCart(user, sessionToken);
        return buildResponseWithSessionHeader(cart);
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponseDTO> addItem(
            @Valid @RequestBody AddToCartRequest request,
            @RequestHeader(value = "X-Session-Token", required = false) String sessionToken,
            Principal principal) {
        AppUser user = resolveUser(principal);
        CartResponseDTO cart = cartService.addItem(user, sessionToken, request);
        return buildResponseWithSessionHeader(cart);
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartResponseDTO> updateItemQuantity(
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest request,
            @RequestHeader(value = "X-Session-Token", required = false) String sessionToken,
            Principal principal) {
        AppUser user = resolveUser(principal);
        CartResponseDTO cart = cartService.updateItemQuantity(user, sessionToken, itemId, request);
        return buildResponseWithSessionHeader(cart);
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartResponseDTO> removeItem(
            @PathVariable Long itemId,
            @RequestHeader(value = "X-Session-Token", required = false) String sessionToken,
            Principal principal) {
        AppUser user = resolveUser(principal);
        CartResponseDTO cart = cartService.removeItem(user, sessionToken, itemId);
        return buildResponseWithSessionHeader(cart);
    }

    @DeleteMapping
    public ResponseEntity<CartResponseDTO> clearCart(
            @RequestHeader(value = "X-Session-Token", required = false) String sessionToken,
            Principal principal) {
        AppUser user = resolveUser(principal);
        CartResponseDTO cart = cartService.clearCart(user, sessionToken);
        return buildResponseWithSessionHeader(cart);
    }

    @PostMapping("/sync")
    public ResponseEntity<CartResponseDTO> syncCart(
            @Valid @RequestBody CartSyncRequest request,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        AppUser user = resolveUser(principal);
        CartResponseDTO cart = cartService.syncGuestCart(user, request);
        return ResponseEntity.ok(cart);
    }

    private AppUser resolveUser(Principal principal) {
        if (principal == null) {
            return null;
        }
        return userRepository.findByUsernameOrEmail(principal.getName()).orElse(null);
    }

    private ResponseEntity<CartResponseDTO> buildResponseWithSessionHeader(CartResponseDTO cart) {
        var responseBuilder = ResponseEntity.ok();
        if (cart.getSessionToken() != null && !cart.getSessionToken().isEmpty()) {
            responseBuilder.header("X-Session-Token", cart.getSessionToken());
        }
        return responseBuilder.body(cart);
    }
}
