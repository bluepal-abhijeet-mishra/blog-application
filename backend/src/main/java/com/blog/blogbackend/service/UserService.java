package com.blog.blogbackend.service;

import com.blog.blogbackend.dto.AuthorProfileResponse;
import com.blog.blogbackend.dto.UserProfileRequest;
import com.blog.blogbackend.dto.UserProfileResponse;
import com.blog.blogbackend.entity.Follow;
import com.blog.blogbackend.entity.FollowId;
import com.blog.blogbackend.entity.PostStatus;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.FollowRepository;
import com.blog.blogbackend.repository.PostRepository;
import com.blog.blogbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final PostRepository postRepository;

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

    public AuthorProfileResponse getAuthorProfile(UUID authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("Author not found"));
        
        long articleCount = postRepository.countByAuthorIdAndStatus(authorId, PostStatus.PUBLISHED);
        long followerCount = followRepository.countByFollowingId(authorId);
        
        boolean isFollowing = false;
        try {
            User currentUser = getCurrentUser();
            isFollowing = followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), authorId);
        } catch (Exception e) {
            // User not authenticated, isFollowing remains false
        }
        
        return AuthorProfileResponse.builder()
                .id(author.getId())
                .displayName(author.getDisplayName())
                .bio(author.getBio())
                .avatarUrl(author.getAvatarUrl())
                .followerCount(followerCount)
                .articleCount(articleCount)
                .isFollowing(isFollowing)
                .build();
    }

    @Transactional
    public boolean toggleFollow(UUID authorId) {
        User currentUser = getCurrentUser();
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("Author not found"));
                
        if (currentUser.getId().equals(authorId)) {
            throw new RuntimeException("You cannot follow yourself");
        }
        
        boolean isFollowing = followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), authorId);
        
        if (isFollowing) {
            followRepository.deleteByFollowerIdAndFollowingId(currentUser.getId(), authorId);
            return false;
        } else {
            Follow follow = Follow.builder()
                    .id(new FollowId(currentUser.getId(), authorId))
                    .follower(currentUser)
                    .following(author)
                    .build();
            followRepository.save(follow);
            return true;
        }
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
