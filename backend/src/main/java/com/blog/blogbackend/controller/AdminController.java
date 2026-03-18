package com.blog.blogbackend.controller;

import com.blog.blogbackend.dto.CategoryDto;
import com.blog.blogbackend.dto.CommentResponse;
import com.blog.blogbackend.dto.PlatformStatsResponse;
import com.blog.blogbackend.dto.PostResponse;
import com.blog.blogbackend.dto.TagDto;
import com.blog.blogbackend.dto.UserResponse;
import com.blog.blogbackend.entity.Role;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.CommentRepository;
import com.blog.blogbackend.repository.PostRepository;
import com.blog.blogbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private CommentRepository commentRepository;

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll().stream()
                .map(u -> UserResponse.builder()
                        .id(u.getId())
                        .email(u.getEmail())
                        .displayName(u.getDisplayName())
                        .role(u.getRole())
                        .createdAt(u.getCreatedAt())
                        .build())
                .collect(Collectors.toList()));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<Void> updateUserRole(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(Role.valueOf(request.get("role")));
        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Void> forceDeleteComment(@PathVariable UUID id) {
        if (!commentRepository.existsById(id)) {
            throw new RuntimeException("Comment not found");
        }
        commentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/posts")
    public ResponseEntity<Page<PostResponse>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postRepository.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()))
                .map(p -> PostResponse.builder()
                        .id(p.getId())
                        .title(p.getTitle())
                        .slug(p.getSlug())
                        .status(p.getStatus())
                        .authorName(p.getAuthor().getDisplayName())
                        .authorId(p.getAuthor().getId())
                        .category(p.getCategory() != null ? CategoryDto.builder()
                                .id(p.getCategory().getId())
                                .name(p.getCategory().getName())
                                .slug(p.getCategory().getSlug())
                                .build() : null)
                        .tags(p.getTags().stream().map(t -> TagDto.builder()
                                .id(t.getId())
                                .name(t.getName())
                                .slug(t.getSlug())
                                .build()).collect(Collectors.toSet()))
                        .createdAt(p.getCreatedAt())
                        .publishedAt(p.getPublishedAt())
                        .build()));
    }

    @GetMapping("/comments")
    public ResponseEntity<Page<CommentResponse>> getAllComments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(commentRepository.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()))
                .map(c -> CommentResponse.builder()
                        .id(c.getId())
                        .content(c.getContent())
                        .authorName(c.getUser().getDisplayName())
                        .authorId(c.getUser().getId())
                        .authorAvatarUrl(c.getUser().getAvatarUrl())
                        .createdAt(c.getCreatedAt())
                        .build()));
    }

    @GetMapping("/stats")
    public ResponseEntity<PlatformStatsResponse> getPlatformStats() {
        return ResponseEntity.ok(PlatformStatsResponse.builder()
                .totalUsers(userRepository.count())
                .totalPosts(postRepository.count())
                .totalComments(commentRepository.count())
                .authorCount(userRepository.findAll().stream().filter(u -> u.getRole() == Role.AUTHOR).count())
                .build());
    }
}
