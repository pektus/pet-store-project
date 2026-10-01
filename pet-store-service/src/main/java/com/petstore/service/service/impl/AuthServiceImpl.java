package com.petstore.service.service.impl;

import com.petstore.domain.dto.UserProfileDTO;
import com.petstore.domain.entity.AppUser;
import com.petstore.service.exception.ResourceNotFoundException;
import com.petstore.service.repository.UserRepository;
import com.petstore.service.service.AuthService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;

    public AuthServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserProfileDTO getProfileByUsername(String username) {
        AppUser user = getUserByUsername(username);
        return new UserProfileDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole()
        );
    }

    @Override
    public AppUser getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + username));
    }
}
