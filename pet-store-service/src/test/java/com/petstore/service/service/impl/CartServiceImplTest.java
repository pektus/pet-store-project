package com.petstore.service.service.impl;

import com.petstore.domain.dto.AddToCartRequest;
import com.petstore.domain.dto.CartResponseDTO;
import com.petstore.domain.dto.CartSyncRequest;
import com.petstore.domain.dto.UpdateCartItemRequest;
import com.petstore.domain.entity.AppUser;
import com.petstore.domain.entity.Cart;
import com.petstore.domain.entity.CartItem;
import com.petstore.domain.entity.Category;
import com.petstore.domain.entity.Pet;
import com.petstore.domain.entity.Supply;
import com.petstore.domain.enums.CartItemType;
import com.petstore.domain.enums.ItemType;
import com.petstore.domain.enums.PetStatus;
import com.petstore.domain.enums.SupplyCategory;
import com.petstore.domain.enums.SupplyStatus;
import com.petstore.service.repository.CartItemRepository;
import com.petstore.service.repository.CartRepository;
import com.petstore.service.repository.PetRepository;
import com.petstore.service.repository.SupplyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceImplTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private PetRepository petRepository;

    @Mock
    private SupplyRepository supplyRepository;

    @InjectMocks
    private CartServiceImpl cartService;

    private AppUser testUser;
    private Cart testCart;
    private Pet testPet;
    private Supply testSupply;

    @BeforeEach
    void setUp() {
        testUser = new AppUser();
        testUser.setId(1L);
        testUser.setEmail("customer@petstore.com");

        testCart = new Cart(testUser);
        testCart.setId(10L);
        testCart.setItems(new ArrayList<>());

        Category category = new Category("Dogs", "Canine companions", 1);
        testPet = new Pet(category, "Buddy", "Golden Retriever", 12, new BigDecimal("350.00"),
                PetStatus.AVAILABLE, "Friendly dog", null);
        testPet.setId(101L);

        testSupply = new Supply("FOOD-DOG-001", "Premium Dog Kibble", SupplyCategory.FOOD,
                new BigDecimal("45.00"), 10, 2, SupplyStatus.ACTIVE,
                "Healthy dry food", null);
        testSupply.setId(201L);
    }

    @Test
    @DisplayName("Should successfully add an available pet to cart with quantity 1")
    void addItem_Pet_Success() {
        AddToCartRequest request = new AddToCartRequest(CartItemType.PET, 101L, 1);

        when(cartRepository.findByUserWithItems(testUser)).thenReturn(Optional.of(testCart));
        when(petRepository.findById(101L)).thenReturn(Optional.of(testPet));
        when(cartItemRepository.findByCartAndPetId(testCart, 101L)).thenReturn(Optional.empty());
        when(cartItemRepository.save(any(CartItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(cartRepository.save(any(Cart.class))).thenAnswer(inv -> inv.getArgument(0));

        CartResponseDTO response = cartService.addItem(testUser, null, request);

        assertThat(response).isNotNull();
        assertThat(response.getTotalItems()).isEqualTo(1);
        assertThat(response.getTotalPrice()).isEqualByComparingTo("350.00");
        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getItemType()).isEqualTo(CartItemType.PET);
        assertThat(response.getItems().get(0).getTitle()).isEqualTo("Buddy");
        assertThat(response.isCanCheckout()).isTrue();
    }

    @Test
    @DisplayName("Should throw IllegalStateException when attempting to add non-available pet")
    void addItem_Pet_Unavailable_ThrowsException() {
        testPet.setStatus(PetStatus.ADOPTED);
        AddToCartRequest request = new AddToCartRequest(CartItemType.PET, 101L, 1);

        when(cartRepository.findByUserWithItems(testUser)).thenReturn(Optional.of(testCart));
        when(petRepository.findById(101L)).thenReturn(Optional.of(testPet));

        assertThatThrownBy(() -> cartService.addItem(testUser, null, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not available for purchase");
    }

    @Test
    @DisplayName("Should return the existing cart when pet is already in cart")
    void addItem_Pet_AlreadyInCart_ReturnsExistingCart() {
        AddToCartRequest request = new AddToCartRequest(CartItemType.PET, 101L, 1);
        CartItem existingItem = new CartItem(testCart, CartItemType.PET, testPet, null, 1, testPet.getPrice());
        existingItem.setId(301L);
        testCart.addItem(existingItem);

        when(cartRepository.findByUserWithItems(testUser)).thenReturn(Optional.of(testCart));
        when(petRepository.findById(101L)).thenReturn(Optional.of(testPet));
        when(cartItemRepository.findByCartAndPetId(testCart, 101L)).thenReturn(Optional.of(existingItem));

        CartResponseDTO response = cartService.addItem(testUser, null, request);

        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getId()).isEqualTo(301L);
        assertThat(response.getTotalItems()).isEqualTo(1);
        verify(cartItemRepository, never()).save(any(CartItem.class));
    }

    @Test
    @DisplayName("Should merge supply quantities up to warehouse stock limit")
    void addItem_Supply_MergeQuantity_CappedAtStock() {
        testSupply.setStockQuantity(5);
        CartItem existingItem = new CartItem(testCart, CartItemType.SUPPLY, null, testSupply, 4, testSupply.getPrice());
        existingItem.setId(501L);
        testCart.addItem(existingItem);

        AddToCartRequest request = new AddToCartRequest(CartItemType.SUPPLY, 201L, 3); // 4 + 3 = 7, but stock is 5

        when(cartRepository.findByUserWithItems(testUser)).thenReturn(Optional.of(testCart));
        when(supplyRepository.findById(201L)).thenReturn(Optional.of(testSupply));
        when(cartItemRepository.findByCartAndSupplyId(testCart, 201L)).thenReturn(Optional.of(existingItem));
        when(cartRepository.save(any(Cart.class))).thenAnswer(inv -> inv.getArgument(0));

        CartResponseDTO response = cartService.addItem(testUser, null, request);

        assertThat(response.getTotalItems()).isEqualTo(5); // Capped at 5
        assertThat(existingItem.getQuantity()).isEqualTo(5);
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when attempting to set pet quantity > 1")
    void updateItemQuantity_Pet_ThrowsException() {
        CartItem petItem = new CartItem(testCart, CartItemType.PET, testPet, null, 1, testPet.getPrice());
        petItem.setId(301L);

        when(cartRepository.findByUserWithItems(testUser)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findById(301L)).thenReturn(Optional.of(petItem));

        UpdateCartItemRequest request = new UpdateCartItemRequest(2);

        assertThatThrownBy(() -> cartService.updateItemQuantity(testUser, null, 301L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Pet items must have a quantity of 1");
    }

    @Test
    @DisplayName("Should flag pet as unavailable and prevent checkout if status changed to ADOPTED")
    void getCart_FlagsUnavailablePet() {
        testPet.setStatus(PetStatus.ADOPTED);
        CartItem petItem = new CartItem(testCart, CartItemType.PET, testPet, null, 1, testPet.getPrice());
        petItem.setId(401L);
        testCart.addItem(petItem);

        when(cartRepository.findByUserWithItems(testUser)).thenReturn(Optional.of(testCart));

        CartResponseDTO response = cartService.getCart(testUser, null);

        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).isAvailable()).isFalse();
        assertThat(response.getItems().get(0).getAvailabilityMessage()).contains("ADOPTED");
        assertThat(response.isCanCheckout()).isFalse();
    }

    @Test
    @DisplayName("Should synchronize guest cart items on login")
    void syncGuestCart_MergesCorrectly() {
        CartSyncRequest request = new CartSyncRequest(List.of(
                new CartSyncRequest.CartSyncItem(CartItemType.PET, 101L, 1),
                new CartSyncRequest.CartSyncItem(CartItemType.SUPPLY, 201L, 2)
        ));

        when(cartRepository.findByUserWithItems(testUser)).thenReturn(Optional.of(testCart));
        when(petRepository.findById(101L)).thenReturn(Optional.of(testPet));
        when(cartItemRepository.findByCartAndPetId(testCart, 101L)).thenReturn(Optional.empty());
        when(supplyRepository.findById(201L)).thenReturn(Optional.of(testSupply));
        when(cartItemRepository.findByCartAndSupplyId(testCart, 201L)).thenReturn(Optional.empty());
        when(cartRepository.save(any(Cart.class))).thenAnswer(inv -> inv.getArgument(0));

        CartResponseDTO response = cartService.syncGuestCart(testUser, request);

        assertThat(response.getTotalItems()).isEqualTo(3);
        assertThat(response.isCanCheckout()).isTrue();
    }
}
