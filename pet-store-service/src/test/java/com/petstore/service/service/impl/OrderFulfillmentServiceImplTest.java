package com.petstore.service.service.impl;

import com.petstore.domain.dto.OrderCancelRequest;
import com.petstore.domain.dto.OrderResponseDTO;
import com.petstore.domain.dto.OrderStatusUpdateRequest;
import com.petstore.domain.entity.AppUser;
import com.petstore.domain.entity.Order;
import com.petstore.domain.entity.OrderItem;
import com.petstore.domain.entity.Pet;
import com.petstore.domain.entity.Supply;
import com.petstore.domain.enums.CardBrand;
import com.petstore.domain.enums.CartItemType;
import com.petstore.domain.enums.OrderStatus;
import com.petstore.domain.enums.PaymentStatus;
import com.petstore.domain.enums.PetStatus;
import com.petstore.domain.enums.SupplyStatus;
import com.petstore.domain.enums.UserRole;
import com.petstore.service.exception.InvalidStateTransitionException;
import com.petstore.service.exception.ResourceNotFoundException;
import com.petstore.service.repository.OrderRepository;
import com.petstore.service.repository.PetRepository;
import com.petstore.service.repository.SupplyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderFulfillmentServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PetRepository petRepository;

    @Mock
    private SupplyRepository supplyRepository;

    @InjectMocks
    private OrderFulfillmentServiceImpl fulfillmentService;

    private AppUser customer;
    private Order testOrder;
    private Pet testPet;
    private Supply testSupply;

    @BeforeEach
    void setUp() {
        customer = new AppUser();
        customer.setId(10L);
        customer.setUsername("testcustomer");
        customer.setEmail("customer@example.com");
        customer.setRole(UserRole.ROLE_CUSTOMER);

        testOrder = new Order(
                "ORD-20261005-001",
                customer,
                new BigDecimal("150.00"),
                new BigDecimal("12.00"),
                BigDecimal.ZERO,
                new BigDecimal("162.00"),
                "Jane Doe",
                "+1-555-0100",
                "123 Main St",
                null,
                "San Francisco",
                "CA",
                "94105",
                "United States",
                PaymentStatus.PAID,
                CardBrand.VISA,
                "4242",
                "TXN-12345"
        );
        testOrder.setId(100L);

        testPet = new Pet(null, "Buddy", "Golden Retriever", 2, new BigDecimal("100.00"), PetStatus.ADOPTED, "A good dog", null);
        testPet.setId(1L);

        testSupply = new Supply("FOOD-DOG-01", "Premium Kibble", com.petstore.domain.enums.SupplyCategory.FOOD, new BigDecimal("50.00"), 10, 5, SupplyStatus.ACTIVE, "Nutritious food", null);
        testSupply.setId(2L);

        OrderItem petItem = new OrderItem(testOrder, CartItemType.PET, testPet, null, "Buddy", "Golden Retriever", new BigDecimal("100.00"), 1, new BigDecimal("100.00"), null);
        OrderItem supplyItem = new OrderItem(testOrder, CartItemType.SUPPLY, null, testSupply, "Premium Kibble", "SKU: FOOD-DOG-01", new BigDecimal("50.00"), 1, new BigDecimal("50.00"), null);

        testOrder.addItem(petItem);
        testOrder.addItem(supplyItem);
    }

    @Test
    void getCustomerOrders_returnsPageOfDTOs() {
        Pageable pageable = PageRequest.of(0, 10);
        when(orderRepository.findByUserIdOrderByCreatedAtDesc(eq(10L), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(testOrder)));

        Page<OrderResponseDTO> result = fulfillmentService.getCustomerOrders(10L, pageable);

        assertThat(result).hasSize(1);
        assertThat(result.getContent().get(0).getOrderNumber()).isEqualTo("ORD-20261005-001");
        assertThat(result.getContent().get(0).getItems()).hasSize(2);
    }

    @Test
    void getCustomerOrderDetail_found_returnsDTO() {
        when(orderRepository.findByOrderNumberAndUserIdWithItems("ORD-20261005-001", 10L))
                .thenReturn(Optional.of(testOrder));

        OrderResponseDTO result = fulfillmentService.getCustomerOrderDetail("ORD-20261005-001", 10L);

        assertThat(result.getOrderNumber()).isEqualTo("ORD-20261005-001");
        assertThat(result.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(result.getTotalAmount()).isEqualByComparingTo("162.00");
    }

    @Test
    void getCustomerOrderDetail_notFound_throwsResourceNotFound() {
        when(orderRepository.findByOrderNumberAndUserIdWithItems("UNKNOWN", 10L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> fulfillmentService.getCustomerOrderDetail("UNKNOWN", 10L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void cancelCustomerOrder_confirmedStatus_success_restocksInventoryAndRefunds() {
        when(orderRepository.findByOrderNumberAndUserIdWithItems("ORD-20261005-001", 10L))
                .thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponseDTO result = fulfillmentService.cancelCustomerOrder(
                "ORD-20261005-001", 10L, new OrderCancelRequest("Found another pet"));

        assertThat(result.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(result.getPaymentStatus()).isEqualTo(PaymentStatus.REFUNDED);
        assertThat(result.getCancellationReason()).isEqualTo("Found another pet");
        assertThat(result.getCancelledAt()).isNotNull();

        // Check pet restock
        assertThat(testPet.getStatus()).isEqualTo(PetStatus.AVAILABLE);
        verify(petRepository).save(testPet);

        // Check supply restock
        assertThat(testSupply.getStockQuantity()).isEqualTo(11);
        verify(supplyRepository).save(testSupply);
    }

    @Test
    void cancelCustomerOrder_notConfirmedStatus_throwsInvalidStateTransition() {
        testOrder.setStatus(OrderStatus.PROCESSING);
        when(orderRepository.findByOrderNumberAndUserIdWithItems("ORD-20261005-001", 10L))
                .thenReturn(Optional.of(testOrder));

        assertThatThrownBy(() -> fulfillmentService.cancelCustomerOrder(
                "ORD-20261005-001", 10L, new OrderCancelRequest("Too late")))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("CONFIRMED");
    }

    @Test
    void getAdminOrders_executesSpecification() {
        Pageable pageable = PageRequest.of(0, 10);
        when(orderRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(testOrder)));

        Page<OrderResponseDTO> result = fulfillmentService.getAdminOrders("Jane", OrderStatus.CONFIRMED, pageable);

        assertThat(result).hasSize(1);
        assertThat(result.getContent().get(0).getRecipientName()).isEqualTo("Jane Doe");
    }

    @Test
    void updateOrderStatus_confirmedToProcessing_success() {
        when(orderRepository.findByOrderNumberWithItems("ORD-20261005-001"))
                .thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderStatusUpdateRequest req = new OrderStatusUpdateRequest(OrderStatus.PROCESSING, null, null, null);
        OrderResponseDTO result = fulfillmentService.updateOrderStatus("ORD-20261005-001", req);

        assertThat(result.getStatus()).isEqualTo(OrderStatus.PROCESSING);
    }

    @Test
    void updateOrderStatus_processingToShipped_withTracking_success() {
        testOrder.setStatus(OrderStatus.PROCESSING);
        when(orderRepository.findByOrderNumberWithItems("ORD-20261005-001"))
                .thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderStatusUpdateRequest req = new OrderStatusUpdateRequest(
                OrderStatus.SHIPPED, "FedEx", "1234567890", null);
        OrderResponseDTO result = fulfillmentService.updateOrderStatus("ORD-20261005-001", req);

        assertThat(result.getStatus()).isEqualTo(OrderStatus.SHIPPED);
        assertThat(result.getCarrier()).isEqualTo("FedEx");
        assertThat(result.getTrackingNumber()).isEqualTo("1234567890");
        assertThat(result.getShippedAt()).isNotNull();
    }

    @Test
    void updateOrderStatus_deliveredToProcessing_throwsInvalidStateTransition() {
        testOrder.setStatus(OrderStatus.DELIVERED);
        when(orderRepository.findByOrderNumberWithItems("ORD-20261005-001"))
                .thenReturn(Optional.of(testOrder));

        OrderStatusUpdateRequest req = new OrderStatusUpdateRequest(OrderStatus.PROCESSING, null, null, null);

        assertThatThrownBy(() -> fulfillmentService.updateOrderStatus("ORD-20261005-001", req))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("terminal state");
    }

    @Test
    void updateOrderStatus_adminCancel_restocksInventoryAndRefunds() {
        testOrder.setStatus(OrderStatus.PROCESSING);
        when(orderRepository.findByOrderNumberWithItems("ORD-20261005-001"))
                .thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderStatusUpdateRequest req = new OrderStatusUpdateRequest(
                OrderStatus.CANCELLED, null, null, "Customer requested phone cancellation");
        OrderResponseDTO result = fulfillmentService.updateOrderStatus("ORD-20261005-001", req);

        assertThat(result.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(result.getPaymentStatus()).isEqualTo(PaymentStatus.REFUNDED);
        assertThat(result.getCancellationReason()).isEqualTo("Customer requested phone cancellation");
        assertThat(result.getCancelledAt()).isNotNull();

        assertThat(testPet.getStatus()).isEqualTo(PetStatus.AVAILABLE);
        verify(petRepository).save(testPet);

        assertThat(testSupply.getStockQuantity()).isEqualTo(11);
        verify(supplyRepository).save(testSupply);
    }
}
