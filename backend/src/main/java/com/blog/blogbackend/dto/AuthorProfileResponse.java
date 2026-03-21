package com.blog.blogbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthorProfileResponse {
    private UUID id;
    private String displayName;
    private String bio;
    private String avatarUrl;
    private long followerCount;
    private long articleCount;
    private boolean isFollowing;
}
