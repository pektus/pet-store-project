package com.petstore.service.service;

import com.petstore.domain.dto.UserProfileDTO;
import com.petstore.domain.entity.AppUser;

public interface AuthService {
    UserProfileDTO getProfileByUsername(String username);
    AppUser getUserByUsername(String username);
}
