package com.blog.blogbackend.controller;

import com.blog.blogbackend.dto.CommentRequest;
import com.blog.blogbackend.dto.CommentResponse;
import com.blog.blogbackend.service.CommentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api")
@Validated
public class CommentController {

    @Autowired
    private CommentService commentService;

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<Page<CommentResponse>> getComments(
            @PathVariable UUID postId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size) {
        
        // Limit page size for performance
        size = Math.min(size, 50);
        
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(commentService.getCommentsForPost(postId, pageable));
    }

    @PostMapping("/posts/{postId}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable UUID postId,
            @Valid @RequestBody CommentRequest request) {
        return ResponseEntity.ok(commentService.addComment(postId, request));
    }

    @PostMapping("/comments/{id}/toggle-like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> toggleLike(@PathVariable UUID id) {
        commentService.toggleLike(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/comments/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteComment(@PathVariable UUID id) {
        commentService.deleteComment(id);
        return ResponseEntity.noContent().build();
    }
}
