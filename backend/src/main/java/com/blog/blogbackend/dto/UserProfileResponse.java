package com.blog.blogbackend.dto;

import com.blog.blogbackend.entity.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UserProfileResponse {
    private UUID id;
    private String email;
    private String displayName;
    private String bio;
    private String avatarUrl;
    private Role role;
    private LocalDateTime createdAt;
}
