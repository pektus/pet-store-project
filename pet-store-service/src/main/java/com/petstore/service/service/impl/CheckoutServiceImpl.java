package com.petstore.service.service.impl;

import com.petstore.domain.dto.CheckoutQuoteDTO;
import com.petstore.domain.dto.CheckoutRequest;
import com.petstore.domain.dto.OrderItemResponseDTO;
import com.petstore.domain.dto.OrderResponseDTO;
import com.petstore.domain.dto.PaymentResult;
import com.petstore.domain.entity.*;
import com.petstore.domain.enums.CartItemType;
import com.petstore.domain.enums.PaymentStatus;
import com.petstore.domain.enums.PetStatus;
import com.petstore.domain.enums.SupplyStatus;
import com.petstore.service.exception.PaymentProcessingException;
import com.petstore.service.exception.ResourceNotFoundException;
import com.petstore.service.repository.*;
import com.petstore.service.service.CheckoutService;
import com.petstore.service.service.PaymentEmulationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class CheckoutServiceImpl implements CheckoutService {

    private static final BigDecimal TAX_RATE = new BigDecimal("0.08");
    private static final BigDecimal FLAT_SHIPPING = new BigDecimal("9.99");
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("75.00");

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final PetRepository petRepository;
    private final SupplyRepository supplyRepository;
    private final PaymentEmulationService paymentEmulationService;

    public CheckoutServiceImpl(OrderRepository orderRepository,
                               OrderItemRepository orderItemRepository,
                               CartRepository cartRepository,
                               CartItemRepository cartItemRepository,
                               PetRepository petRepository,
                               SupplyRepository supplyRepository,
                               PaymentEmulationService paymentEmulationService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.petRepository = petRepository;
        this.supplyRepository = supplyRepository;
        this.paymentEmulationService = paymentEmulationService;
    }

    @Override
    @Transactional(readOnly = true)
    public CheckoutQuoteDTO getCheckoutQuote(AppUser user) {
        if (user == null) {
            throw new IllegalArgumentException("User must be authenticated to obtain checkout quote");
        }

        Cart cart = cartRepository.findByUserWithItems(user)
                .orElseThrow(() -> new ResourceNotFoundException("Shopping cart not found for user: " + user.getEmail()));

        List<CartItem> items = cart.getItems() != null ? cart.getItems() : List.of();
        BigDecimal subtotal = BigDecimal.ZERO;
        int totalItems = 0;
        boolean hasPet = false;

        for (CartItem item : items) {
            BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotal = subtotal.add(lineTotal);
            totalItems += item.getQuantity();
            if (item.getItemType() == CartItemType.PET) {
                hasPet = true;
            }
        }

        boolean isFreeShipping = (subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0 || hasPet || totalItems == 0);
        BigDecimal shipping = (totalItems == 0 || isFreeShipping)
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : FLAT_SHIPPING.setScale(2, RoundingMode.HALF_UP);

        BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(shipping).add(tax).setScale(2, RoundingMode.HALF_UP);

        return new CheckoutQuoteDTO(
                subtotal.setScale(2, RoundingMode.HALF_UP),
                shipping,
                isFreeShipping,
                tax,
                total,
                totalItems,
                hasPet
        );
    }

    @Override
    public OrderResponseDTO processCheckout(AppUser user, CheckoutRequest request) {
        if (user == null) {
            throw new IllegalArgumentException("User must be authenticated to complete checkout");
        }

        Cart cart = cartRepository.findByUserWithItems(user)
                .orElseThrow(() -> new ResourceNotFoundException("Shopping cart not found for user: " + user.getEmail()));

        List<CartItem> cartItems = cart.getItems();
        if (cartItems == null || cartItems.isEmpty()) {
            throw new IllegalStateException("Cannot checkout with an empty cart");
        }

        // 1. Inventory & Availability Validation
        BigDecimal subtotal = BigDecimal.ZERO;
        boolean hasPet = false;

        for (CartItem item : cartItems) {
            if (item.getItemType() == CartItemType.PET) {
                Pet pet = petRepository.findById(item.getPet().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Pet not found with ID: " + item.getPet().getId()));

                if (pet.getStatus() != PetStatus.AVAILABLE) {
                    throw new IllegalStateException("Pet " + pet.getName() + " is no longer available for purchase");
                }
                hasPet = true;
                subtotal = subtotal.add(item.getUnitPrice());

            } else if (item.getItemType() == CartItemType.SUPPLY) {
                Supply supply = supplyRepository.findById(item.getSupply().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Supply not found with ID: " + item.getSupply().getId()));

                if (supply.getStatus() != SupplyStatus.ACTIVE || supply.getStockQuantity() < item.getQuantity()) {
                    throw new IllegalStateException("Supply " + supply.getName() + " has insufficient stock (Available: " +
                            supply.getStockQuantity() + ", Requested: " + item.getQuantity() + ")");
                }
                subtotal = subtotal.add(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            }
        }

        // 2. Compute Pricing, Shipping & Tax
        boolean isFreeShipping = (subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0 || hasPet);
        BigDecimal shippingAmount = isFreeShipping
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : FLAT_SHIPPING.setScale(2, RoundingMode.HALF_UP);

        BigDecimal taxAmount = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(shippingAmount).add(taxAmount).setScale(2, RoundingMode.HALF_UP);

        // 3. Process Payment Emulation
        PaymentResult paymentResult = paymentEmulationService.processPayment(request.getPayment(), totalAmount);
        if (!paymentResult.isSuccessful()) {
            throw new PaymentProcessingException(paymentResult.getErrorMessage());
        }

        // 4. Create Order Entity
        String orderNumber = generateUniqueOrderNumber();
        Order order = new Order(
                orderNumber,
                user,
                subtotal.setScale(2, RoundingMode.HALF_UP),
                taxAmount,
                shippingAmount,
                totalAmount,
                request.getRecipientName(),
                request.getRecipientPhone(),
                request.getShippingAddressLine1(),
                request.getShippingAddressLine2(),
                request.getShippingCity(),
                request.getShippingState(),
                request.getShippingPostalCode(),
                request.getShippingCountry(),
                PaymentStatus.PAID,
                paymentResult.getCardBrand(),
                paymentResult.getCardLastFour(),
                paymentResult.getTransactionId()
        );

        // 5. Reserve & Deduct Inventory + Build Order Items Snapshot
        for (CartItem item : cartItems) {
            if (item.getItemType() == CartItemType.PET) {
                Pet pet = item.getPet();
                pet.setStatus(PetStatus.ADOPTED);
                petRepository.save(pet);

                String subtitle = pet.getBreed() + (pet.getCategory() != null ? " (" + pet.getCategory().getName() + ")" : "");
                OrderItem orderItem = new OrderItem(
                        order,
                        CartItemType.PET,
                        pet,
                        null,
                        pet.getName(),
                        subtitle,
                        item.getUnitPrice(),
                        1,
                        item.getUnitPrice(),
                        pet.getPhotoUrl()
                );
                order.addItem(orderItem);

            } else if (item.getItemType() == CartItemType.SUPPLY) {
                Supply supply = item.getSupply();
                int remainingStock = supply.getStockQuantity() - item.getQuantity();
                supply.setStockQuantity(remainingStock);
                if (remainingStock <= 0) {
                    supply.setStatus(SupplyStatus.OUT_OF_STOCK);
                }
                supplyRepository.save(supply);

                BigDecimal lineSubtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                OrderItem orderItem = new OrderItem(
                        order,
                        CartItemType.SUPPLY,
                        null,
                        supply,
                        supply.getName(),
                        "SKU: " + supply.getSku(),
                        item.getUnitPrice(),
                        item.getQuantity(),
                        lineSubtotal,
                        supply.getPhotoUrl()
                );
                order.addItem(orderItem);
            }
        }

        // Save order and cascade order items
        Order savedOrder = orderRepository.save(order);

        // 6. Clear Customer's Cart
        cart.clear();
        cartRepository.save(cart);

        return toOrderResponseDTO(savedOrder);
    }

    private String generateUniqueOrderNumber() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randPart = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return "ORD-" + datePart + "-" + randPart;
    }

    private OrderResponseDTO toOrderResponseDTO(Order order) {
        List<OrderItemResponseDTO> itemDTOs = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem oi : order.getItems()) {
                Long itemId = oi.getItemType() == CartItemType.PET
                        ? (oi.getPet() != null ? oi.getPet().getId() : null)
                        : (oi.getSupply() != null ? oi.getSupply().getId() : null);

                itemDTOs.add(new OrderItemResponseDTO(
                        oi.getId(),
                        oi.getItemType(),
                        itemId,
                        oi.getTitle(),
                        oi.getSubtitle(),
                        oi.getUnitPrice(),
                        oi.getQuantity(),
                        oi.getSubtotal(),
                        oi.getPhotoUrl()
                ));
            }
        }

        return new OrderResponseDTO(
                order.getOrderNumber(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getTransactionId(),
                order.getCardBrand(),
                order.getCardLastFour(),
                order.getSubtotal(),
                order.getTaxAmount(),
                order.getShippingAmount(),
                order.getTotalAmount(),
                order.getRecipientName(),
                order.getRecipientPhone(),
                order.getShippingAddressLine1(),
                order.getShippingAddressLine2(),
                order.getShippingCity(),
                order.getShippingState(),
                order.getShippingPostalCode(),
                order.getShippingCountry(),
                itemDTOs,
                order.getCreatedAt()
        );
    }
}
