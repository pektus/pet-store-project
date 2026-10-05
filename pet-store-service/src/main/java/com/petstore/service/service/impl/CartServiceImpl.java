package com.petstore.service.service.impl;

import com.petstore.domain.dto.AddToCartRequest;
import com.petstore.domain.dto.CartItemResponseDTO;
import com.petstore.domain.dto.CartResponseDTO;
import com.petstore.domain.dto.CartSyncRequest;
import com.petstore.domain.dto.UpdateCartItemRequest;
import com.petstore.domain.entity.AppUser;
import com.petstore.domain.entity.Cart;
import com.petstore.domain.entity.CartItem;
import com.petstore.domain.entity.Pet;
import com.petstore.domain.entity.Supply;
import com.petstore.domain.enums.CartItemType;
import com.petstore.domain.enums.PetStatus;
import com.petstore.domain.enums.SupplyStatus;
import com.petstore.service.exception.ResourceNotFoundException;
import com.petstore.service.repository.CartItemRepository;
import com.petstore.service.repository.CartRepository;
import com.petstore.service.repository.PetRepository;
import com.petstore.service.repository.SupplyRepository;
import com.petstore.service.service.CartService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final PetRepository petRepository;
    private final SupplyRepository supplyRepository;

    public CartServiceImpl(CartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           PetRepository petRepository,
                           SupplyRepository supplyRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.petRepository = petRepository;
        this.supplyRepository = supplyRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public CartResponseDTO getCart(AppUser user, String sessionToken) {
        Cart cart = getOrCreateCart(user, sessionToken);
        return toCartResponseDTO(cart);
    }

    @Override
    public CartResponseDTO addItem(AppUser user, String sessionToken, AddToCartRequest request) {
        Cart cart = getOrCreateCart(user, sessionToken);

        if (request.getItemType() == CartItemType.PET) {
            Pet pet = petRepository.findById(request.getItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Pet not found with ID: " + request.getItemId()));

            if (pet.getStatus() != PetStatus.AVAILABLE) {
                throw new IllegalStateException("Pet " + pet.getName() + " is not available for purchase (Status: " + pet.getStatus() + ")");
            }

            if (cartItemRepository.findByCartAndPetId(cart, pet.getId()).isEmpty()) {
                CartItem cartItem = new CartItem(cart, CartItemType.PET, pet, null, 1, pet.getPrice());
                cart.addItem(cartItem);
                cartItemRepository.save(cartItem);
            }
        } else if (request.getItemType() == CartItemType.SUPPLY) {
            Supply supply = supplyRepository.findById(request.getItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supply not found with ID: " + request.getItemId()));

            if (supply.getStatus() != SupplyStatus.ACTIVE || supply.getStockQuantity() <= 0) {
                throw new IllegalStateException("Supply " + supply.getName() + " is currently out of stock");
            }

            int requestedQty = request.getQuantity();
            var existingOpt = cartItemRepository.findByCartAndSupplyId(cart, supply.getId());

            if (existingOpt.isPresent()) {
                CartItem existing = existingOpt.get();
                int newQty = existing.getQuantity() + requestedQty;
                if (newQty > supply.getStockQuantity()) {
                    newQty = supply.getStockQuantity();
                }
                existing.setQuantity(newQty);
                existing.setUnitPrice(supply.getPrice());
                cartItemRepository.save(existing);
            } else {
                int addQty = Math.min(requestedQty, supply.getStockQuantity());
                CartItem cartItem = new CartItem(cart, CartItemType.SUPPLY, null, supply, addQty, supply.getPrice());
                cart.addItem(cartItem);
                cartItemRepository.save(cartItem);
            }
        }

        cartRepository.save(cart);
        return toCartResponseDTO(cart);
    }

    @Override
    public CartResponseDTO updateItemQuantity(AppUser user, String sessionToken, Long itemId, UpdateCartItemRequest request) {
        Cart cart = getOrCreateCart(user, sessionToken);
        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found: " + itemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new IllegalArgumentException("Cart item does not belong to the current cart");
        }

        if (cartItem.getItemType() == CartItemType.PET) {
            if (request.getQuantity() != 1) {
                throw new IllegalArgumentException("Pet items must have a quantity of 1");
            }
        } else if (cartItem.getItemType() == CartItemType.SUPPLY) {
            Supply supply = cartItem.getSupply();
            if (supply != null && request.getQuantity() > supply.getStockQuantity()) {
                throw new IllegalArgumentException("Requested quantity " + request.getQuantity() +
                        " exceeds available stock of " + supply.getStockQuantity());
            }
            cartItem.setQuantity(request.getQuantity());
            cartItemRepository.save(cartItem);
        }

        return toCartResponseDTO(cart);
    }

    @Override
    public CartResponseDTO removeItem(AppUser user, String sessionToken, Long itemId) {
        Cart cart = getOrCreateCart(user, sessionToken);
        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found: " + itemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new IllegalArgumentException("Cart item does not belong to the current cart");
        }

        cart.removeItem(cartItem);
        cartItemRepository.delete(cartItem);
        cartRepository.save(cart);

        return toCartResponseDTO(cart);
    }

    @Override
    public CartResponseDTO clearCart(AppUser user, String sessionToken) {
        Cart cart = getOrCreateCart(user, sessionToken);
        cart.clear();
        cartRepository.save(cart);
        return toCartResponseDTO(cart);
    }

    @Override
    public CartResponseDTO syncGuestCart(AppUser user, CartSyncRequest request) {
        if (user == null) {
            throw new IllegalArgumentException("User must be authenticated to sync guest cart");
        }

        Cart cart = getOrCreateCart(user, null);

        if (request != null && request.getItems() != null) {
            for (CartSyncRequest.CartSyncItem syncItem : request.getItems()) {
                if (syncItem.getItemType() == CartItemType.PET) {
                    petRepository.findById(syncItem.getItemId()).ifPresent(pet -> {
                        if (pet.getStatus() == PetStatus.AVAILABLE) {
                            if (cartItemRepository.findByCartAndPetId(cart, pet.getId()).isEmpty()) {
                                CartItem cartItem = new CartItem(cart, CartItemType.PET, pet, null, 1, pet.getPrice());
                                cart.addItem(cartItem);
                                cartItemRepository.save(cartItem);
                            }
                        }
                    });
                } else if (syncItem.getItemType() == CartItemType.SUPPLY) {
                    supplyRepository.findById(syncItem.getItemId()).ifPresent(supply -> {
                        if (supply.getStatus() == SupplyStatus.ACTIVE && supply.getStockQuantity() > 0) {
                            var existingOpt = cartItemRepository.findByCartAndSupplyId(cart, supply.getId());
                            if (existingOpt.isPresent()) {
                                CartItem existing = existingOpt.get();
                                int mergedQty = existing.getQuantity() + syncItem.getQuantity();
                                if (mergedQty > supply.getStockQuantity()) {
                                    mergedQty = supply.getStockQuantity();
                                }
                                existing.setQuantity(mergedQty);
                                cartItemRepository.save(existing);
                            } else {
                                int addQty = Math.min(syncItem.getQuantity(), supply.getStockQuantity());
                                CartItem cartItem = new CartItem(cart, CartItemType.SUPPLY, null, supply, addQty, supply.getPrice());
                                cart.addItem(cartItem);
                                cartItemRepository.save(cartItem);
                            }
                        }
                    });
                }
            }
        }

        cartRepository.save(cart);
        return toCartResponseDTO(cart);
    }

    private Cart getOrCreateCart(AppUser user, String sessionToken) {
        if (user != null) {
            return cartRepository.findByUserWithItems(user)
                    .orElseGet(() -> {
                        Cart newCart = new Cart(user);
                        return cartRepository.save(newCart);
                    });
        }

        String token = (sessionToken != null && !sessionToken.trim().isEmpty())
                ? sessionToken.trim()
                : UUID.randomUUID().toString();

        return cartRepository.findBySessionTokenWithItems(token)
                .orElseGet(() -> {
                    Cart newCart = new Cart(token);
                    return cartRepository.save(newCart);
                });
    }

    private CartResponseDTO toCartResponseDTO(Cart cart) {
        List<CartItemResponseDTO> itemDTOs = new ArrayList<>();
        int totalItems = 0;
        BigDecimal totalPrice = BigDecimal.ZERO;
        boolean canCheckout = true;

        if (cart.getItems() != null) {
            for (CartItem item : cart.getItems()) {
                CartItemResponseDTO dto = new CartItemResponseDTO();
                dto.setId(item.getId());
                dto.setItemType(item.getItemType());
                dto.setUnitPrice(item.getUnitPrice());
                dto.setQuantity(item.getQuantity());

                BigDecimal subtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                dto.setSubtotal(subtotal);

                if (item.getItemType() == CartItemType.PET) {
                    Pet pet = item.getPet();
                    if (pet != null) {
                        dto.setItemId(pet.getId());
                        dto.setTitle(pet.getName());
                        String categoryName = pet.getCategory() != null ? pet.getCategory().getName() : "";
                        dto.setSubtitle(pet.getBreed() + (!categoryName.isEmpty() ? " (" + categoryName + ")" : ""));
                        dto.setPhotoUrl(pet.getPhotoUrl());
                        dto.setStockAvailable(1);

                        boolean available = (pet.getStatus() == PetStatus.AVAILABLE);
                        dto.setAvailable(available);
                        if (!available) {
                            dto.setAvailabilityMessage("Pet is no longer available (Status: " + pet.getStatus() + ")");
                            canCheckout = false;
                        }
                    } else {
                        dto.setAvailable(false);
                        dto.setAvailabilityMessage("Pet item no longer exists");
                        canCheckout = false;
                    }
                } else if (item.getItemType() == CartItemType.SUPPLY) {
                    Supply supply = item.getSupply();
                    if (supply != null) {
                        dto.setItemId(supply.getId());
                        dto.setTitle(supply.getName());
                        dto.setSubtitle("SKU: " + supply.getSku());
                        dto.setPhotoUrl(supply.getPhotoUrl());
                        dto.setStockAvailable(supply.getStockQuantity());

                        boolean inStock = (supply.getStatus() == SupplyStatus.ACTIVE && supply.getStockQuantity() > 0);
                        boolean sufficient = inStock && (supply.getStockQuantity() >= item.getQuantity());

                        dto.setAvailable(inStock && sufficient);
                        if (!inStock) {
                            dto.setAvailabilityMessage("Item is out of stock");
                            canCheckout = false;
                        } else if (!sufficient) {
                            dto.setAvailabilityMessage("Only " + supply.getStockQuantity() + " available in stock");
                            canCheckout = false;
                        }
                    } else {
                        dto.setAvailable(false);
                        dto.setAvailabilityMessage("Supply item no longer exists");
                        canCheckout = false;
                    }
                }

                itemDTOs.add(dto);
                totalItems += item.getQuantity();
                totalPrice = totalPrice.add(subtotal);
            }
        }

        if (totalItems == 0) {
            canCheckout = false;
        }

        return new CartResponseDTO(
                cart.getId(),
                cart.getSessionToken(),
                totalItems,
                totalPrice,
                canCheckout,
                itemDTOs
        );
    }
}
