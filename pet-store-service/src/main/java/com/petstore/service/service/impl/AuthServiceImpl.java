package com.petstore.service.service.impl;

import com.petstore.domain.dto.CustomerProfileUpdateRequest;
import com.petstore.domain.dto.CustomerRegistrationRequest;
import com.petstore.domain.dto.RegistrationResponse;
import com.petstore.domain.dto.UserProfileDTO;
import com.petstore.domain.entity.AppUser;
import com.petstore.domain.enums.UserRole;
import com.petstore.service.exception.DuplicateResourceException;
import com.petstore.service.exception.InvalidTokenException;
import com.petstore.service.exception.ResourceNotFoundException;
import com.petstore.service.repository.UserRepository;
import com.petstore.service.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserProfileDTO getProfileByUsername(String username) {
        AppUser user = getUserByUsername(username);
        return toUserProfileDTO(user);
    }

    @Override
    public AppUser getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + username));
    }

    @Override
    @Transactional
    public RegistrationResponse registerCustomer(CustomerRegistrationRequest request, String baseUrl) {
        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException("Username '" + request.username() + "' is already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Email '" + request.email() + "' is already registered");
        }

        String verificationToken = UUID.randomUUID().toString();
        Instant tokenExpiry = Instant.now().plus(24, ChronoUnit.HOURS);
        String hashedPassword = passwordEncoder.encode(request.password());

        AppUser customer = new AppUser(
                request.username(),
                request.email(),
                hashedPassword,
                UserRole.ROLE_CUSTOMER,
                false // Inactive until email verified
        );
        customer.setFullName(request.fullName());
        customer.setPhone(request.phone());
        customer.setEmailVerified(false);
        customer.setVerificationToken(verificationToken);
        customer.setVerificationTokenExpiry(tokenExpiry);

        userRepository.save(customer);

        String activationUrl = (baseUrl != null ? baseUrl : "") + "/verify?token=" + verificationToken;
        log.info("=== [DEV/TEST ACTIVATION LINK] Account created for {}. Verification URL: {} ===",
                customer.getEmail(), activationUrl);

        return new RegistrationResponse(
                "Registration successful. Please check your email to activate your account.",
                customer.getUsername(),
                customer.getEmail(),
                verificationToken,
                activationUrl
        );
    }

    @Override
    @Transactional
    public AppUser verifyEmail(String token) {
        if (token == null || token.isBlank()) {
            throw new InvalidTokenException("Verification token cannot be null or empty");
        }

        AppUser user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new InvalidTokenException("Invalid or unrecognized verification token"));

        if (user.getVerificationTokenExpiry() != null && user.getVerificationTokenExpiry().isBefore(Instant.now())) {
            throw new InvalidTokenException("Verification token has expired. Please request a new activation link.");
        }

        user.setEnabled(true);
        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);

        AppUser updated = userRepository.save(user);
        log.info("Account successfully activated for username: {}", updated.getUsername());
        return updated;
    }

    @Override
    @Transactional
    public RegistrationResponse resendVerification(String emailOrUsername, String baseUrl) {
        AppUser user = getUserByUsername(emailOrUsername);
        if (user.isEmailVerified()) {
            throw new IllegalStateException("Account is already verified and active.");
        }

        String newToken = UUID.randomUUID().toString();
        user.setVerificationToken(newToken);
        user.setVerificationTokenExpiry(Instant.now().plus(24, ChronoUnit.HOURS));
        userRepository.save(user);

        String activationUrl = (baseUrl != null ? baseUrl : "") + "/verify?token=" + newToken;
        log.info("=== [DEV/TEST ACTIVATION LINK RESENT] Verification URL for {}: {} ===",
                user.getEmail(), activationUrl);

        return new RegistrationResponse(
                "A new activation link has been generated. Please check your email.",
                user.getUsername(),
                user.getEmail(),
                newToken,
                activationUrl
        );
    }

    @Override
    @Transactional
    public UserProfileDTO updateProfile(String username, CustomerProfileUpdateRequest request) {
        AppUser user = getUserByUsername(username);
        user.setFullName(request.fullName());
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        AppUser saved = userRepository.save(user);
        return toUserProfileDTO(saved);
    }

    private UserProfileDTO toUserProfileDTO(AppUser user) {
        return new UserProfileDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getFullName(),
                user.getPhone(),
                user.isEmailVerified()
        );
    }
}
