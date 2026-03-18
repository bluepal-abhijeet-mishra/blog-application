package com.blog.blogbackend.controller;

import com.blog.blogbackend.dto.CategoryRequestCreateRequest;
import com.blog.blogbackend.dto.CategoryRequestDecisionRequest;
import com.blog.blogbackend.dto.CategoryRequestDto;
import com.blog.blogbackend.entity.CategoryRequestStatus;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.UserRepository;
import com.blog.blogbackend.service.CategoryRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CategoryRequestController {

    private final CategoryRequestService categoryRequestService;
    private final UserRepository userRepository;

    @PostMapping("/api/category-requests")
    @PreAuthorize("hasAnyRole('AUTHOR', 'ADMIN')")
    public ResponseEntity<CategoryRequestDto> submitCategoryRequest(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CategoryRequestCreateRequest request
    ) {
        User requester = getAuthenticatedUser(principal);
        return ResponseEntity.ok(categoryRequestService.submitRequest(requester, request));
    }

    @GetMapping("/api/category-requests/my")
    @PreAuthorize("hasAnyRole('AUTHOR', 'ADMIN')")
    public ResponseEntity<List<CategoryRequestDto>> getMyRequests(@AuthenticationPrincipal UserDetails principal) {
        User requester = getAuthenticatedUser(principal);
        return ResponseEntity.ok(categoryRequestService.getMyRequests(requester));
    }

    @GetMapping("/api/admin/category-requests")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CategoryRequestDto>> getAdminRequests(
            @RequestParam(required = false) CategoryRequestStatus status
    ) {
        return ResponseEntity.ok(categoryRequestService.getAllRequests(status));
    }

    @PutMapping("/api/admin/category-requests/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryRequestDto> approveRequest(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) CategoryRequestDecisionRequest decision
    ) {
        User reviewer = getAuthenticatedUser(principal);
        return ResponseEntity.ok(categoryRequestService.approveRequest(reviewer, id, decision));
    }

    @PutMapping("/api/admin/category-requests/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryRequestDto> rejectRequest(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id,
            @Valid @RequestBody CategoryRequestDecisionRequest decision
    ) {
        User reviewer = getAuthenticatedUser(principal);
        return ResponseEntity.ok(categoryRequestService.rejectRequest(reviewer, id, decision));
    }

    private User getAuthenticatedUser(UserDetails principal) {
        if (principal == null) {
            throw new RuntimeException("Unauthorized");
        }
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
