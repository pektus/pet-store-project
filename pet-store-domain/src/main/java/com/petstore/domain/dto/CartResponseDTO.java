package com.petstore.domain.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class CartResponseDTO {

    private Long cartId;
    private String sessionToken;
    private int totalItems;
    private BigDecimal totalPrice = BigDecimal.ZERO;
    private boolean canCheckout;
    private List<CartItemResponseDTO> items = new ArrayList<>();

    public CartResponseDTO() {
    }

    public CartResponseDTO(Long cartId, String sessionToken, int totalItems, BigDecimal totalPrice,
                           boolean canCheckout, List<CartItemResponseDTO> items) {
        this.cartId = cartId;
        this.sessionToken = sessionToken;
        this.totalItems = totalItems;
        this.totalPrice = totalPrice;
        this.canCheckout = canCheckout;
        this.items = items != null ? items : new ArrayList<>();
    }

    public Long getCartId() {
        return cartId;
    }

    public void setCartId(Long cartId) {
        this.cartId = cartId;
    }

    public String getSessionToken() {
        return sessionToken;
    }

    public void setSessionToken(String sessionToken) {
        this.sessionToken = sessionToken;
    }

    public int getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(int totalItems) {
        this.totalItems = totalItems;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public boolean isCanCheckout() {
        return canCheckout;
    }

    public void setCanCheckout(boolean canCheckout) {
        this.canCheckout = canCheckout;
    }

    public List<CartItemResponseDTO> getItems() {
        return items;
    }

    public void setItems(List<CartItemResponseDTO> items) {
        this.items = items;
    }
}
