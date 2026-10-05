package com.petstore.service.service;

import com.petstore.domain.dto.CustomerProfileUpdateRequest;
import com.petstore.domain.dto.CustomerRegistrationRequest;
import com.petstore.domain.dto.RegistrationResponse;
import com.petstore.domain.dto.UserProfileDTO;
import com.petstore.domain.entity.AppUser;

public interface AuthService {
    UserProfileDTO getProfileByUsername(String username);
    AppUser getUserByUsername(String username);
    RegistrationResponse registerCustomer(CustomerRegistrationRequest request, String baseUrl);
    AppUser verifyEmail(String token);
    RegistrationResponse resendVerification(String emailOrUsername, String baseUrl);
    UserProfileDTO updateProfile(String username, CustomerProfileUpdateRequest request);
}
