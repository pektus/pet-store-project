package com.petstore.service.service.impl;

import com.petstore.domain.dto.CheckoutQuoteDTO;
import com.petstore.domain.dto.CheckoutRequest;
import com.petstore.domain.dto.OrderResponseDTO;
import com.petstore.domain.dto.PaymentRequest;
import com.petstore.domain.dto.PaymentResult;
import com.petstore.domain.entity.*;
import com.petstore.domain.enums.CardBrand;
import com.petstore.domain.enums.CartItemType;
import com.petstore.domain.enums.PetStatus;
import com.petstore.domain.enums.SupplyCategory;
import com.petstore.domain.enums.SupplyStatus;
import com.petstore.service.exception.PaymentProcessingException;
import com.petstore.service.repository.*;
import com.petstore.service.service.PaymentEmulationService;
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
class CheckoutServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private PetRepository petRepository;

    @Mock
    private SupplyRepository supplyRepository;

    @Mock
    private PaymentEmulationService paymentEmulationService;

    @Mock
    private com.petstore.service.service.AccountingLedgerService accountingLedgerService;

    @InjectMocks
    private CheckoutServiceImpl checkoutService;

    private AppUser testUser;
    private Cart testCart;
    private Pet testPet;
    private Supply testSupply;
    private CheckoutRequest testCheckoutRequest;

    @BeforeEach
    void setUp() {
        testUser = new AppUser();
        testUser.setId(1L);
        testUser.setEmail("customer@petstore.com");

        testCart = new Cart(testUser);
        testCart.setId(10L);
        testCart.setItems(new ArrayList<>());

        Category category = new Category("Dogs", "Canine companions", 1);
        testPet = new Pet(category, "Buddy", "Golden Retriever", 12, new BigDecimal("250.00"),
                PetStatus.AVAILABLE, "Friendly dog", null);
        testPet.setId(101L);

        testSupply = new Supply("FOOD-DOG-001", "Premium Dog Kibble", SupplyCategory.FOOD,
                new BigDecimal("45.00"), 10, 2, SupplyStatus.ACTIVE,
                "Healthy dry food", null);
        testSupply.setId(201L);

        PaymentRequest paymentRequest = new PaymentRequest(
                "Jane Doe",
                "4000 0012 3456 7899",
                "12",
                "30",
                "123"
        );

        testCheckoutRequest = new CheckoutRequest(
                "Jane Doe",
                "+1-555-0199",
                "123 Market Street",
                "Apt 4B",
                "San Francisco",
                "CA",
                "94105",
                "United States",
                paymentRequest
        );
    }

    @Test
    @DisplayName("Should generate accurate quote with tax and free shipping for pet")
    void getCheckoutQuote_Success_CalculatesTaxAndFreeShipping() {
        CartItem petItem = new CartItem(testCart, CartItemType.PET, testPet, null, 1, testPet.getPrice());
        testCart.addItem(petItem);

        when(cartRepository.findByUserWithItems(testUser)).thenReturn(Optional.of(testCart));

        CheckoutQuoteDTO quote = checkoutService.getCheckoutQuote(testUser);

        assertThat(quote.getSubtotal()).isEqualByComparingTo("250.00");
        assertThat(quote.isFreeShipping()).isTrue();
        assertThat(quote.getShippingAmount()).isEqualByComparingTo("0.00");
        assertThat(quote.getTaxAmount()).isEqualByComparingTo("20.00"); // 250 * 0.08 = 20.00
        assertThat(quote.getTotalAmount()).isEqualByComparingTo("270.00");
    }

    @Test
    @DisplayName("Should process checkout atomically, reserving pet and deducting supply stock")
    void processCheckout_Success_ReservesPetAndDeductsSupply() {
        CartItem petItem = new CartItem(testCart, CartItemType.PET, testPet, null, 1, testPet.getPrice());
        petItem.setId(1L);
        testCart.addItem(petItem);

        CartItem supplyItem = new CartItem(testCart, CartItemType.SUPPLY, null, testSupply, 2, testSupply.getPrice());
        supplyItem.setId(2L);
        testCart.addItem(supplyItem);

        when(cartRepository.findByUserWithItems(testUser)).thenReturn(Optional.of(testCart));
        when(petRepository.findById(101L)).thenReturn(Optional.of(testPet));
        when(supplyRepository.findById(201L)).thenReturn(Optional.of(testSupply));
        when(paymentEmulationService.processPayment(any(), any()))
                .thenReturn(PaymentResult.success("TXN-EMUL-123456", CardBrand.VISA, "7899"));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponseDTO response = checkoutService.processCheckout(testUser, testCheckoutRequest);

        assertThat(response).isNotNull();
        assertThat(response.getOrderNumber()).startsWith("ORD-");
        assertThat(response.getTransactionId()).isEqualTo("TXN-EMUL-123456");
        assertThat(response.getItems()).hasSize(2);

        // Verify inventory reservation
        assertThat(testPet.getStatus()).isEqualTo(PetStatus.ADOPTED);
        verify(petRepository).save(testPet);

        // Verify supply stock deduction (10 - 2 = 8)
        assertThat(testSupply.getStockQuantity()).isEqualTo(8);
        verify(supplyRepository).save(testSupply);

        // Verify cart cleared
        assertThat(testCart.getItems()).isEmpty();
        verify(cartRepository).save(testCart);
    }

    @Test
    @DisplayName("Should throw IllegalStateException when pet is no longer available")
    void processCheckout_Fails_WhenPetNotAvailable() {
        testPet.setStatus(PetStatus.ADOPTED); // already adopted
        CartItem petItem = new CartItem(testCart, CartItemType.PET, testPet, null, 1, testPet.getPrice());
        testCart.addItem(petItem);

        when(cartRepository.findByUserWithItems(testUser)).thenReturn(Optional.of(testCart));
        when(petRepository.findById(101L)).thenReturn(Optional.of(testPet));

        assertThatThrownBy(() -> checkoutService.processCheckout(testUser, testCheckoutRequest))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("no longer available for purchase");

        verifyNoInteractions(paymentEmulationService);
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw PaymentProcessingException when payment emulation is declined")
    void processCheckout_Fails_WhenPaymentDeclined() {
        CartItem supplyItem = new CartItem(testCart, CartItemType.SUPPLY, null, testSupply, 1, testSupply.getPrice());
        testCart.addItem(supplyItem);

        when(cartRepository.findByUserWithItems(testUser)).thenReturn(Optional.of(testCart));
        when(supplyRepository.findById(201L)).thenReturn(Optional.of(testSupply));
        when(paymentEmulationService.processPayment(any(), any()))
                .thenReturn(PaymentResult.failure("Card Declined: Insufficient Funds", CardBrand.VISA, "0002"));

        assertThatThrownBy(() -> checkoutService.processCheckout(testUser, testCheckoutRequest))
                .isInstanceOf(PaymentProcessingException.class)
                .hasMessageContaining("Insufficient Funds");

        // Inventory should NOT be modified
        assertThat(testSupply.getStockQuantity()).isEqualTo(10);
        verify(orderRepository, never()).save(any());
    }
}
