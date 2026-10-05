package com.petstore.service.repository;

import com.petstore.domain.entity.Cart;
import com.petstore.domain.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByCartId(Long cartId);

    Optional<CartItem> findByCartAndPetId(Cart cart, Long petId);

    Optional<CartItem> findByCartAndSupplyId(Cart cart, Long supplyId);

    boolean existsByCartAndPetId(Cart cart, Long petId);
}
