package com.petstore.service.repository;

import com.petstore.domain.entity.AppUser;
import com.petstore.domain.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    @Query("SELECT DISTINCT c FROM Cart c LEFT JOIN FETCH c.items WHERE c.user = :user")
    Optional<Cart> findByUserWithItems(@Param("user") AppUser user);

    Optional<Cart> findByUser(AppUser user);

    @Query("SELECT DISTINCT c FROM Cart c LEFT JOIN FETCH c.items WHERE c.sessionToken = :sessionToken")
    Optional<Cart> findBySessionTokenWithItems(@Param("sessionToken") String sessionToken);

    Optional<Cart> findBySessionToken(String sessionToken);

    Optional<Cart> findByUserId(Long userId);
}
