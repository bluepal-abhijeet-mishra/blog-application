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

import com.blog.blogbackend.dto.MonthlyTrend;
import com.blog.blogbackend.entity.PostStatus;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
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
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        List<User> users = userRepository.findAll();
        List<com.blog.blogbackend.entity.Post> posts = postRepository.findAll();
        YearMonth currentMonth = YearMonth.now();

        // Role Distribution
        Map<String, Long> roleDistribution = users.stream()
                .collect(Collectors.groupingBy(u -> u.getRole().name(), Collectors.counting()));

        // Category Distribution (only for published posts)
        Map<String, Long> categoryDistribution = posts.stream()
                .filter(p -> p.getStatus() == PostStatus.PUBLISHED && p.getCategory() != null)
                .collect(Collectors.groupingBy(p -> p.getCategory().getName(), Collectors.counting()));

        // User Growth (last 6 months, null-safe and zero-filled)
        Map<YearMonth, Long> userGrowthByMonth = users.stream()
                .filter(u -> u.getCreatedAt() != null)
                .collect(Collectors.groupingBy(u -> YearMonth.from(u.getCreatedAt()), Collectors.counting()));
        List<MonthlyTrend> userGrowth = buildMonthlyTrend(currentMonth, userGrowthByMonth, formatter);

        // Post Activity (last 6 months, only published, null-safe and zero-filled)
        Map<YearMonth, Long> postActivityByMonth = posts.stream()
                .filter(p -> p.getStatus() == PostStatus.PUBLISHED && p.getPublishedAt() != null)
                .collect(Collectors.groupingBy(p -> YearMonth.from(p.getPublishedAt()), Collectors.counting()));
        List<MonthlyTrend> postActivity = buildMonthlyTrend(currentMonth, postActivityByMonth, formatter);

        return ResponseEntity.ok(PlatformStatsResponse.builder()
                .totalUsers(users.size())
                .totalPosts(posts.size())
                .totalComments(commentRepository.count())
                .authorCount(users.stream().filter(u -> u.getRole() == Role.AUTHOR).count())
                .userGrowth(userGrowth)
                .postActivity(postActivity)
                .categoryDistribution(categoryDistribution)
                .roleDistribution(roleDistribution)
                .build());
    }

    private List<MonthlyTrend> buildMonthlyTrend(
            YearMonth currentMonth,
            Map<YearMonth, Long> valuesByMonth,
            DateTimeFormatter formatter
    ) {
        List<MonthlyTrend> trend = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth month = currentMonth.minusMonths(i);
            long count = valuesByMonth.getOrDefault(month, 0L);
            trend.add(new MonthlyTrend(month.format(formatter), count));
        }
        return trend;
    }
}
