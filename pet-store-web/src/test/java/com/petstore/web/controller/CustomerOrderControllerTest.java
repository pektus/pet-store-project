package com.petstore.web.controller;

import com.petstore.domain.dto.OrderCancelRequest;
import com.petstore.domain.dto.OrderResponseDTO;
import com.petstore.domain.entity.AppUser;
import com.petstore.domain.enums.OrderStatus;
import com.petstore.domain.enums.PaymentStatus;
import com.petstore.domain.enums.UserRole;
import com.petstore.service.repository.UserRepository;
import com.petstore.service.service.OrderFulfillmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerOrderControllerTest {

    @Mock
    private OrderFulfillmentService fulfillmentService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomerOrderController controller;

    private AppUser customer;
    private Principal principal;

    @BeforeEach
    void setUp() {
        customer = new AppUser();
        customer.setId(42L);
        customer.setUsername("jane");
        customer.setEmail("jane@example.com");
        customer.setRole(UserRole.ROLE_CUSTOMER);

        principal = () -> "jane";
    }

    @Test
    void getMyOrders_authenticated_returnsOkWithPage() {
        when(userRepository.findByUsernameOrEmail("jane")).thenReturn(Optional.of(customer));
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setOrderNumber("ORD-001");
        when(fulfillmentService.getCustomerOrders(eq(42L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(dto)));

        ResponseEntity<Page<OrderResponseDTO>> response = controller.getMyOrders(0, 10, principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getContent()).hasSize(1);
        assertThat(response.getBody().getContent().get(0).getOrderNumber()).isEqualTo("ORD-001");
    }

    @Test
    void getMyOrders_unauthenticated_returnsUnauthorized() {
        ResponseEntity<Page<OrderResponseDTO>> response = controller.getMyOrders(0, 10, null);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void getMyOrderDetail_authenticated_returnsOk() {
        when(userRepository.findByUsernameOrEmail("jane")).thenReturn(Optional.of(customer));
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setOrderNumber("ORD-001");
        when(fulfillmentService.getCustomerOrderDetail("ORD-001", 42L)).thenReturn(dto);

        ResponseEntity<OrderResponseDTO> response = controller.getMyOrderDetail("ORD-001", principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getOrderNumber()).isEqualTo("ORD-001");
    }

    @Test
    void cancelMyOrder_authenticated_returnsOkWithCancelledOrder() {
        when(userRepository.findByUsernameOrEmail("jane")).thenReturn(Optional.of(customer));
        OrderCancelRequest cancelReq = new OrderCancelRequest("Mistake order");
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setOrderNumber("ORD-001");
        dto.setStatus(OrderStatus.CANCELLED);
        dto.setPaymentStatus(PaymentStatus.REFUNDED);
        dto.setCancellationReason("Mistake order");

        when(fulfillmentService.cancelCustomerOrder(eq("ORD-001"), eq(42L), any(OrderCancelRequest.class)))
                .thenReturn(dto);

        ResponseEntity<OrderResponseDTO> response = controller.cancelMyOrder("ORD-001", cancelReq, principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(response.getBody().getPaymentStatus()).isEqualTo(PaymentStatus.REFUNDED);
    }
}
