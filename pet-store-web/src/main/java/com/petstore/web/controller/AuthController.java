package com.petstore.web.controller;

import com.petstore.domain.dto.AuthResponse;
import com.petstore.domain.dto.LoginRequest;
import com.petstore.domain.dto.UserProfileDTO;
import com.petstore.service.service.AuthService;
import com.petstore.web.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AuthService authService;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtTokenProvider tokenProvider,
                          AuthService authService) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.usernameOrEmail(),
                        request.password()
                )
        );

        String username = authentication.getName();
        UserProfileDTO profile = authService.getProfileByUsername(username);
        String token = tokenProvider.generateToken(profile.username(), profile.role().name());

        AuthResponse response = new AuthResponse(
                token,
                "Bearer",
                tokenProvider.getExpirationMs() / 1000,
                profile
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileDTO> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UserProfileDTO profile = authService.getProfileByUsername(principal.getName());
        return ResponseEntity.ok(profile);
    }
}
