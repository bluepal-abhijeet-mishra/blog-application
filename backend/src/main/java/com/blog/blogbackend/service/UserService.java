package com.blog.blogbackend.service;

import com.blog.blogbackend.dto.UserProfileRequest;
import com.blog.blogbackend.dto.UserProfileResponse;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public UserProfileResponse getCurrentUserProfile() {
        User user = getCurrentUser();
        return mapToResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(UserProfileRequest request) {
        User user = getCurrentUser();
        
        user.setDisplayName(request.getDisplayName());
        user.setBio(request.getBio());
        user.setAvatarUrl(request.getAvatarUrl());
        
        return mapToResponse(userRepository.save(user));
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UserProfileResponse mapToResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
