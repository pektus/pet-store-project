package com.petstore.domain.dto;

import com.petstore.domain.enums.CartItemType;

import java.math.BigDecimal;

public class OrderItemResponseDTO {

    private Long id;
    private CartItemType itemType;
    private Long itemId;
    private String title;
    private String subtitle;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal subtotal;
    private String photoUrl;

    public OrderItemResponseDTO() {
    }

    public OrderItemResponseDTO(Long id, CartItemType itemType, Long itemId, String title,
                                String subtitle, BigDecimal unitPrice, Integer quantity,
                                BigDecimal subtotal, String photoUrl) {
        this.id = id;
        this.itemType = itemType;
        this.itemId = itemId;
        this.title = title;
        this.subtitle = subtitle;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.subtotal = subtotal;
        this.photoUrl = photoUrl;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }
}
