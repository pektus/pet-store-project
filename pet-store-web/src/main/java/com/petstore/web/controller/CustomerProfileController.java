package com.petstore.web.controller;

import com.petstore.domain.dto.CustomerProfileUpdateRequest;
import com.petstore.domain.dto.UserProfileDTO;
import com.petstore.service.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/customer")
public class CustomerProfileController {

    private final AuthService authService;

    public CustomerProfileController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDTO> getProfile(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UserProfileDTO profile = authService.getProfileByUsername(principal.getName());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileDTO> updateProfile(
            @Valid @RequestBody CustomerProfileUpdateRequest request,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UserProfileDTO updated = authService.updateProfile(principal.getName(), request);
        return ResponseEntity.ok(updated);
    }
}
