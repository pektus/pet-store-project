package com.petstore.web.controller;

import com.petstore.domain.dto.*;
import com.petstore.domain.entity.AppUser;
import com.petstore.service.service.AuthService;
import com.petstore.web.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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

    @PostMapping("/register")
    public ResponseEntity<RegistrationResponse> register(
            @Valid @RequestBody CustomerRegistrationRequest request,
            HttpServletRequest servletRequest) {
        String baseUrl = extractBaseUrl(servletRequest);
        RegistrationResponse response = authService.registerCustomer(request, baseUrl);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/verify")
    public ResponseEntity<VerifyEmailResponse> verifyEmail(@RequestParam String token) {
        AppUser verifiedUser = authService.verifyEmail(token);
        String jwtToken = tokenProvider.generateToken(verifiedUser.getUsername(), verifiedUser.getRole().name());

        UserProfileDTO profile = new UserProfileDTO(
                verifiedUser.getId(),
                verifiedUser.getUsername(),
                verifiedUser.getEmail(),
                verifiedUser.getRole(),
                verifiedUser.getFullName(),
                verifiedUser.getPhone(),
                verifiedUser.isEmailVerified()
        );

        VerifyEmailResponse response = new VerifyEmailResponse(
                "Account successfully activated and verified.",
                jwtToken,
                "Bearer",
                tokenProvider.getExpirationMs() / 1000,
                profile
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<RegistrationResponse> resendVerification(
            @RequestParam String identifier,
            HttpServletRequest servletRequest) {
        String baseUrl = extractBaseUrl(servletRequest);
        RegistrationResponse response = authService.resendVerification(identifier, baseUrl);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileDTO> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserProfileDTO profile = authService.getProfileByUsername(principal.getName());
        return ResponseEntity.ok(profile);
    }

    private String extractBaseUrl(HttpServletRequest request) {
        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();
        
        StringBuilder url = new StringBuilder();
        url.append(scheme).append("://").append(serverName);
        if ((scheme.equals("http") && serverPort != 80) || (scheme.equals("https") && serverPort != 443)) {
            url.append(":").append(serverPort);
        }
        return url.toString();
    }
}
