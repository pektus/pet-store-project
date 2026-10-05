package com.petstore.service.repository;

import com.petstore.domain.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsername(String username);
    Optional<AppUser> findByEmail(String email);
    Optional<AppUser> findByVerificationToken(String verificationToken);

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM AppUser u WHERE u.username = :login OR u.email = :login")
    Optional<AppUser> findByUsernameOrEmail(@Param("login") String login);
}
