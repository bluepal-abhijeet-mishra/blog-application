package com.blog.blogbackend.service;

import com.blog.blogbackend.dto.AuthorProfileResponse;
import com.blog.blogbackend.dto.UserProfileRequest;
import com.blog.blogbackend.dto.UserProfileResponse;
import com.blog.blogbackend.entity.Follow;
import com.blog.blogbackend.entity.PostStatus;
import com.blog.blogbackend.entity.Role;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.FollowRepository;
import com.blog.blogbackend.repository.PostRepository;
import com.blog.blogbackend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private FollowRepository followRepository;

    @Mock
    private PostRepository postRepository;

    @InjectMocks
    private UserService userService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getCurrentUserProfileShouldReturnUserResponse() {
        User user = testUser("user@example.com");
        authenticate(user.getEmail());
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        UserProfileResponse response = userService.getCurrentUserProfile();

        assertNotNull(response);
        assertEquals(user.getEmail(), response.getEmail());
        assertEquals(user.getDisplayName(), response.getDisplayName());
    }

    @Test
    void updateProfileShouldModifyUserAndSave() {
        User user = testUser("user@example.com");
        authenticate(user.getEmail());
        UserProfileRequest request = new UserProfileRequest();
        request.setDisplayName("Updated Name");
        request.setBio("New Bio");
        request.setAvatarUrl("http://avatar.com/new.png");
        
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileResponse response = userService.updateProfile(request);

        assertEquals("Updated Name", response.getDisplayName());
        assertEquals("New Bio", response.getBio());
        assertEquals("http://avatar.com/new.png", response.getAvatarUrl());
        verify(userRepository).save(user);
    }

    @Test
    void getAuthorProfileShouldReturnAuthorStats() {
        UUID authorId = UUID.randomUUID();
        User author = testUser("author@example.com");
        author.setId(authorId);
        
        User currentUser = testUser("current@example.com");
        authenticate(currentUser.getEmail());

        when(userRepository.findById(authorId)).thenReturn(Optional.of(author));
        when(postRepository.countByAuthorIdAndStatus(authorId, PostStatus.PUBLISHED)).thenReturn(5L);
        when(followRepository.countByFollowingId(authorId)).thenReturn(10L);
        when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(Optional.of(currentUser));
        when(followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), authorId)).thenReturn(true);

        AuthorProfileResponse response = userService.getAuthorProfile(authorId);

        assertEquals(author.getDisplayName(), response.getDisplayName());
        assertEquals(5L, response.getArticleCount());
        assertEquals(10L, response.getFollowerCount());
        assertTrue(response.isFollowing());
    }

    @Test
    void toggleFollowShouldDeleteWhenAlreadyFollowing() {
        UUID authorId = UUID.randomUUID();
        User author = testUser("author@example.com");
        author.setId(authorId);
        
        User currentUser = testUser("current@example.com");
        authenticate(currentUser.getEmail());

        when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(Optional.of(currentUser));
        when(userRepository.findById(authorId)).thenReturn(Optional.of(author));
        when(followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), authorId)).thenReturn(true);

        boolean result = userService.toggleFollow(authorId);

        assertFalse(result);
        verify(followRepository).deleteByFollowerIdAndFollowingId(currentUser.getId(), authorId);
    }

    @Test
    void toggleFollowShouldSaveWhenNotFollowing() {
        UUID authorId = UUID.randomUUID();
        User author = testUser("author@example.com");
        author.setId(authorId);
        
        User currentUser = testUser("current@example.com");
        authenticate(currentUser.getEmail());

        when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(Optional.of(currentUser));
        when(userRepository.findById(authorId)).thenReturn(Optional.of(author));
        when(followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), authorId)).thenReturn(false);

        boolean result = userService.toggleFollow(authorId);

        assertTrue(result);
        verify(followRepository).save(any(Follow.class));
    }

    @Test
    void toggleFollowShouldThrowWhenSelfFollow() {
        User user = testUser("user@example.com");
        authenticate(user.getEmail());
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        UUID userId = user.getId();
        RuntimeException exception = assertThrows(RuntimeException.class, () -> userService.toggleFollow(userId));
        assertEquals("You cannot follow yourself", exception.getMessage());
    }

    private void authenticate(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, "password")
        );
    }

    private User testUser(String email) {
        return User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .displayName("Test User")
                .bio("Test Bio")
                .role(Role.READER)
                .build();
    }
}
