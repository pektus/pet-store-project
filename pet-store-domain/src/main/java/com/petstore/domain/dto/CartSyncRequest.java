package com.petstore.domain.dto;

import com.petstore.domain.enums.CartItemType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;

public class CartSyncRequest {

    @NotEmpty(message = "Items list cannot be empty for sync")
    @Valid
    private List<CartSyncItem> items = new ArrayList<>();

    public CartSyncRequest() {
    }

    public CartSyncRequest(List<CartSyncItem> items) {
        this.items = items;
    }

    public List<CartSyncItem> getItems() {
        return items;
    }

    public void setItems(List<CartSyncItem> items) {
        this.items = items;
    }

    public static class CartSyncItem {
        @NotNull(message = "Item type is required")
        private CartItemType itemType;

        @NotNull(message = "Item ID is required")
        private Long itemId;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity = 1;

        public CartSyncItem() {
        }

        public CartSyncItem(CartItemType itemType, Long itemId, Integer quantity) {
            this.itemType = itemType;
            this.itemId = itemId;
            this.quantity = quantity;
        }

        public CartItemType getItemType() {
            return itemType;
        }

        public void setItemType(CartItemType itemType) {
            this.itemType = itemType;
        }

        public Long getItemId() {
            return itemId;
        }

        public void setItemId(Long itemId) {
            this.itemId = itemId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
    }
}
