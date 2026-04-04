package com.blog.blogbackend.controller;

import com.blog.blogbackend.dto.AuthorProfileResponse;
import com.blog.blogbackend.dto.UserProfileRequest;
import com.blog.blogbackend.dto.UserProfileResponse;
import com.blog.blogbackend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile() {
        return ResponseEntity.ok(userService.getCurrentUserProfile());
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(@Valid @RequestBody UserProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(request));
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<AuthorProfileResponse> getAuthorProfile(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getAuthorProfile(id));
    }

    @PostMapping("/{id}/follow")
    public ResponseEntity<Boolean> toggleFollow(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.toggleFollow(id));
    }
}
