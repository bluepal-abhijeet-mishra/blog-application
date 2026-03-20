package com.blog.blogbackend.controller;

import com.blog.blogbackend.dto.PostRequest;
import com.blog.blogbackend.dto.PostResponse;
import com.blog.blogbackend.service.PostService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@Validated
public class PostController {

    @Autowired
    private PostService postService;

    @GetMapping
    public ResponseEntity<Page<PostResponse>> getPosts(
            @RequestParam(required = false) @Size(max = 50, message = "Tag parameter too long") String tag,
            @RequestParam(required = false) @Size(max = 50, message = "Category parameter too long") String category,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size) {
        
        // Limit page size for performance
        size = Math.min(size, 50);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("publishedAt").descending());
        return ResponseEntity.ok(postService.getPublishedPosts(tag, category, pageable));
    }

    @GetMapping("/id/{id}")
    @PreAuthorize("hasAnyRole('AUTHOR', 'ADMIN')")
    public ResponseEntity<PostResponse> getPostByIdForEdit(@PathVariable UUID id) {
        return ResponseEntity.ok(postService.getPostForEdit(id));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<PostResponse> getPostBySlug(
            @PathVariable @Size(min = 1, max = 255, message = "Invalid slug") String slug) {
        return ResponseEntity.ok(postService.getPostBySlug(slug));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('AUTHOR', 'ADMIN')")
    public ResponseEntity<PostResponse> createPost(@Valid @RequestBody PostRequest request) {
        return ResponseEntity.ok(postService.createPost(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('AUTHOR', 'ADMIN')")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable UUID id, 
            @Valid @RequestBody PostRequest request) {
        return ResponseEntity.ok(postService.updatePost(id, request));
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('AUTHOR', 'ADMIN')")
    public ResponseEntity<PostResponse> publishPost(@PathVariable UUID id) {
        return ResponseEntity.ok(postService.publishPost(id));
    }

    @PatchMapping("/{id}/unpublish")
    @PreAuthorize("hasAnyRole('AUTHOR', 'ADMIN')")
    public ResponseEntity<PostResponse> unpublishPost(@PathVariable UUID id) {
        return ResponseEntity.ok(postService.unpublishPost(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('AUTHOR', 'ADMIN')")
    public ResponseEntity<Void> deletePost(@PathVariable UUID id) {
        postService.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<Page<PostResponse>> searchPosts(
            @RequestParam @Size(min = 1, max = 100, message = "Search query must be between 1 and 100 characters") String q,
            @RequestParam(defaultValue = "relevance") @Size(max = 20, message = "Sort value too long") String sort,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size) {
        
        // Limit page size for performance
        
        // Limit page size for performance
        size = Math.min(size, 50);
        
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(postService.searchPosts(q, sort, pageable));
    }

    @GetMapping("/my-posts")
    @PreAuthorize("hasAnyRole('AUTHOR', 'ADMIN')")
    public ResponseEntity<Page<PostResponse>> getMyPosts(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size) {
        
        size = Math.min(size, 50);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(postService.getAuthorPosts(pageable));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('AUTHOR', 'ADMIN')")
    public ResponseEntity<com.blog.blogbackend.dto.AuthorStatsResponse> getStats() {
        return ResponseEntity.ok(postService.getAuthorStats());
    }
}
