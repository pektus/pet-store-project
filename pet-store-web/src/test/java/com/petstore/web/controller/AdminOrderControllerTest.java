package com.petstore.web.controller;

import com.petstore.domain.dto.OrderResponseDTO;
import com.petstore.domain.dto.OrderStatusUpdateRequest;
import com.petstore.domain.enums.OrderStatus;
import com.petstore.service.service.OrderFulfillmentService;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminOrderControllerTest {

    @Mock
    private OrderFulfillmentService fulfillmentService;

    @InjectMocks
    private AdminOrderController controller;

    @Test
    void getAdminOrders_returnsOkWithPage() {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setOrderNumber("ORD-999");
        when(fulfillmentService.getAdminOrders(eq("test"), eq(OrderStatus.PROCESSING), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(dto)));

        ResponseEntity<Page<OrderResponseDTO>> response = controller.getAdminOrders("test", OrderStatus.PROCESSING, 0, 10);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getContent()).hasSize(1);
    }

    @Test
    void getAdminOrderDetail_returnsOkWithOrder() {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setOrderNumber("ORD-999");
        when(fulfillmentService.getAdminOrderDetail("ORD-999")).thenReturn(dto);

        ResponseEntity<OrderResponseDTO> response = controller.getAdminOrderDetail("ORD-999");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getOrderNumber()).isEqualTo("ORD-999");
    }

    @Test
    void updateOrderStatus_returnsOkWithUpdatedOrder() {
        OrderStatusUpdateRequest req = new OrderStatusUpdateRequest(OrderStatus.SHIPPED, "UPS", "1Z999", null);
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setOrderNumber("ORD-999");
        dto.setStatus(OrderStatus.SHIPPED);
        dto.setCarrier("UPS");
        dto.setTrackingNumber("1Z999");

        when(fulfillmentService.updateOrderStatus(eq("ORD-999"), eq(req))).thenReturn(dto);

        ResponseEntity<OrderResponseDTO> response = controller.updateOrderStatus("ORD-999", req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(OrderStatus.SHIPPED);
        assertThat(response.getBody().getCarrier()).isEqualTo("UPS");
    }
}
