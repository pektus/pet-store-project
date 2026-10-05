package com.petstore.service.service;

import com.petstore.domain.dto.AddToCartRequest;
import com.petstore.domain.dto.CartResponseDTO;
import com.petstore.domain.dto.CartSyncRequest;
import com.petstore.domain.dto.UpdateCartItemRequest;
import com.petstore.domain.entity.AppUser;

public interface CartService {

    CartResponseDTO getCart(AppUser user, String sessionToken);

    CartResponseDTO addItem(AppUser user, String sessionToken, AddToCartRequest request);

    CartResponseDTO updateItemQuantity(AppUser user, String sessionToken, Long itemId, UpdateCartItemRequest request);

    CartResponseDTO removeItem(AppUser user, String sessionToken, Long itemId);

    CartResponseDTO clearCart(AppUser user, String sessionToken);

    CartResponseDTO syncGuestCart(AppUser user, CartSyncRequest request);
}
