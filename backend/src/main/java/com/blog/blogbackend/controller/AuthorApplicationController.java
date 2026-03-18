package com.blog.blogbackend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.blog.blogbackend.dto.AuthorApplicationDto;
import com.blog.blogbackend.entity.AuthorApplicationStatus;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.UserRepository;
import com.blog.blogbackend.service.AuthorApplicationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class AuthorApplicationController {

    private final AuthorApplicationService applicationService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('READER')")
    public ResponseEntity<?> submitApplication(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody AuthorApplicationDto dto) {
        try {
            User user = getAuthenticatedUser(principal);
            applicationService.submitApplication(user, dto);
            return ResponseEntity.ok("Application submitted successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('READER') or hasRole('AUTHOR')")
    public ResponseEntity<List<AuthorApplicationDto>> getMyApplications(@AuthenticationPrincipal UserDetails principal) {
        User user = getAuthenticatedUser(principal);
        return ResponseEntity.ok(applicationService.getMyApplications(user));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuthorApplicationDto>> getAllApplications(@RequestParam(required = false) AuthorApplicationStatus status) {
        return ResponseEntity.ok(applicationService.getAllApplications(status));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveApplication(@PathVariable UUID id) {
        try {
            applicationService.approveApplication(id);
            return ResponseEntity.ok("Application approved. User is now an AUTHOR.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectApplication(@PathVariable UUID id, @RequestBody String reason) {
        try {
            applicationService.rejectApplication(id, reason);
            return ResponseEntity.ok("Application rejected.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private User getAuthenticatedUser(UserDetails principal) {
        if (principal == null) {
            throw new RuntimeException("Unauthorized");
        }

        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
