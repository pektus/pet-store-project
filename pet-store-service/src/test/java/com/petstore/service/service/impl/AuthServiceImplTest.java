package com.petstore.service.service.impl;

import com.petstore.domain.dto.CustomerProfileUpdateRequest;
import com.petstore.domain.dto.CustomerRegistrationRequest;
import com.petstore.domain.dto.RegistrationResponse;
import com.petstore.domain.dto.UserProfileDTO;
import com.petstore.domain.entity.AppUser;
import com.petstore.domain.enums.UserRole;
import com.petstore.service.exception.DuplicateResourceException;
import com.petstore.service.exception.InvalidTokenException;
import com.petstore.service.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthServiceImpl authService;

    private CustomerRegistrationRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new CustomerRegistrationRequest(
                "johndoe",
                "john@example.com",
                "Password123!",
                "John Doe",
                "+1-555-0199"
        );
    }

    @Test
    @DisplayName("Should successfully register customer with email verification token and inactive status")
    void registerCustomer_success() {
        when(userRepository.existsByUsername("johndoe")).thenReturn(false);
        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123!")).thenReturn("hashedPassword");

        RegistrationResponse response = authService.registerCustomer(validRequest, "http://localhost:8080");

        assertThat(response).isNotNull();
        assertThat(response.username()).isEqualTo("johndoe");
        assertThat(response.email()).isEqualTo("john@example.com");
        assertThat(response.activationToken()).isNotNull();
        assertThat(response.activationUrl()).contains("token=" + response.activationToken());

        ArgumentCaptor<AppUser> userCaptor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(userCaptor.capture());

        AppUser savedUser = userCaptor.getValue();
        assertThat(savedUser.getUsername()).isEqualTo("johndoe");
        assertThat(savedUser.getEmail()).isEqualTo("john@example.com");
        assertThat(savedUser.getPasswordHash()).isEqualTo("hashedPassword");
        assertThat(savedUser.getRole()).isEqualTo(UserRole.ROLE_CUSTOMER);
        assertThat(savedUser.isEnabled()).isFalse();
        assertThat(savedUser.isEmailVerified()).isFalse();
        assertThat(savedUser.getVerificationToken()).isNotNull();
        assertThat(savedUser.getVerificationTokenExpiry()).isAfter(Instant.now());
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException when username is already taken")
    void registerCustomer_duplicateUsername_throwsException() {
        when(userRepository.existsByUsername("johndoe")).thenReturn(true);

        assertThatThrownBy(() -> authService.registerCustomer(validRequest, "http://localhost:8080"))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Username 'johndoe' is already taken");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException when email is already registered")
    void registerCustomer_duplicateEmail_throwsException() {
        when(userRepository.existsByUsername("johndoe")).thenReturn(false);
        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.registerCustomer(validRequest, "http://localhost:8080"))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email 'john@example.com' is already registered");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should successfully verify email, activate user, and clear token")
    void verifyEmail_success() {
        AppUser inactiveUser = new AppUser("johndoe", "john@example.com", "hash", UserRole.ROLE_CUSTOMER, false);
        inactiveUser.setEmailVerified(false);
        inactiveUser.setVerificationToken("token-123");
        inactiveUser.setVerificationTokenExpiry(Instant.now().plus(1, ChronoUnit.HOURS));

        when(userRepository.findByVerificationToken("token-123")).thenReturn(Optional.of(inactiveUser));
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AppUser verified = authService.verifyEmail("token-123");

        assertThat(verified.isEnabled()).isTrue();
        assertThat(verified.isEmailVerified()).isTrue();
        assertThat(verified.getVerificationToken()).isNull();
        assertThat(verified.getVerificationTokenExpiry()).isNull();
    }

    @Test
    @DisplayName("Should throw InvalidTokenException when verification token is unrecognized")
    void verifyEmail_invalidToken_throwsException() {
        when(userRepository.findByVerificationToken("unknown-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verifyEmail("unknown-token"))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("Invalid or unrecognized verification token");
    }

    @Test
    @DisplayName("Should throw InvalidTokenException when token is expired")
    void verifyEmail_expiredToken_throwsException() {
        AppUser expiredUser = new AppUser("johndoe", "john@example.com", "hash", UserRole.ROLE_CUSTOMER, false);
        expiredUser.setVerificationToken("expired-token");
        expiredUser.setVerificationTokenExpiry(Instant.now().minus(1, ChronoUnit.HOURS));

        when(userRepository.findByVerificationToken("expired-token")).thenReturn(Optional.of(expiredUser));

        assertThatThrownBy(() -> authService.verifyEmail("expired-token"))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("expired");
    }

    @Test
    @DisplayName("Should successfully update customer profile")
    void updateProfile_success() {
        AppUser user = new AppUser("johndoe", "john@example.com", "hash", UserRole.ROLE_CUSTOMER, true);
        user.setFullName("John Doe");
        user.setPhone("+1-555-0100");

        when(userRepository.findByUsername("johndoe")).thenReturn(Optional.of(user));
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerProfileUpdateRequest updateReq = new CustomerProfileUpdateRequest("Johnathan Doe", "+1-555-9999");
        UserProfileDTO updated = authService.updateProfile("johndoe", updateReq);

        assertThat(updated.fullName()).isEqualTo("Johnathan Doe");
        assertThat(updated.phone()).isEqualTo("+1-555-9999");
    }
}
