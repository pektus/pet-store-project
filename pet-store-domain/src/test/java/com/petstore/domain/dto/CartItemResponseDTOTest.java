package com.petstore.domain.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.petstore.domain.enums.CartItemType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CartItemResponseDTOTest {

    @Test
    @DisplayName("Should serialize CartItemResponseDTO and CheckoutQuoteDTO with both isX and X boolean properties for client compatibility")
    void testSerializationPropertyNames() throws Exception {
        CartItemResponseDTO itemDto = new CartItemResponseDTO(
                1L,
                CartItemType.PET,
                10L,
                "Bella",
                "Golden Retriever",
                new BigDecimal("250.00"),
                1,
                new BigDecimal("250.00"),
                "/photos/bella.jpg",
                true,
                1,
                null
        );

        CartResponseDTO cartDto = new CartResponseDTO(
                1L,
                "token-123",
                1,
                new BigDecimal("250.00"),
                true,
                List.of(itemDto)
        );

        CheckoutQuoteDTO quoteDto = new CheckoutQuoteDTO(
                new BigDecimal("250.00"),
                BigDecimal.ZERO,
                true,
                new BigDecimal("20.00"),
                new BigDecimal("270.00"),
                1,
                true
        );

        ObjectMapper mapper = new ObjectMapper();

        String itemJson = mapper.writeValueAsString(itemDto);
        assertThat(itemJson).contains("\"isAvailable\":true");
        assertThat(itemJson).contains("\"available\":true");

        String cartJson = mapper.writeValueAsString(cartDto);
        assertThat(cartJson).contains("\"canCheckout\":true");
        assertThat(cartJson).contains("\"isAvailable\":true");

        String quoteJson = mapper.writeValueAsString(quoteDto);
        assertThat(quoteJson).contains("\"isFreeShipping\":true");
        assertThat(quoteJson).contains("\"freeShipping\":true");
        assertThat(quoteJson).contains("\"hasPet\":true");
    }
}
