package com.blog.blogbackend.service;

import com.blog.blogbackend.dto.CategoryRequestCreateRequest;
import com.blog.blogbackend.dto.CategoryRequestDecisionRequest;
import com.blog.blogbackend.dto.CategoryRequestDto;
import com.blog.blogbackend.entity.Category;
import com.blog.blogbackend.entity.CategoryRequest;
import com.blog.blogbackend.entity.CategoryRequestStatus;
import com.blog.blogbackend.entity.NotificationType;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.CategoryRepository;
import com.blog.blogbackend.repository.CategoryRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryRequestService {

    private final CategoryRequestRepository categoryRequestRepository;
    private final CategoryRepository categoryRepository;
    private final SlugService slugService;
    private final NotificationService notificationService;

    @Transactional
    public CategoryRequestDto submitRequest(User requester, CategoryRequestCreateRequest request) {
        String normalizedName = normalizeName(request.getName());
        String slug = slugService.slugify(normalizedName);
        if (slug == null || slug.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category name");
        }

        if (categoryRepository.findBySlug(slug).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category already exists");
        }

        boolean hasPending = categoryRequestRepository.existsBySlugAndStatusIn(
                slug, Set.of(CategoryRequestStatus.PENDING)
        );
        if (hasPending) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A request for this category is already pending review");
        }

        CategoryRequest saved = categoryRequestRepository.save(CategoryRequest.builder()
                .requestedBy(requester)
                .name(normalizedName)
                .slug(slug)
                .reason(normalizeOptional(request.getReason()))
                .status(CategoryRequestStatus.PENDING)
                .build());

        notificationService.createNotificationForAdmins(
                NotificationType.CATEGORY_REQUEST_SUBMITTED,
                "New category request",
                requester.getDisplayName() + " requested category \"" + normalizedName + "\".",
                "/admin"
        );

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<CategoryRequestDto> getMyRequests(User requester) {
        return categoryRequestRepository.findByRequestedByIdOrderByCreatedAtDesc(requester.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CategoryRequestDto> getAllRequests(CategoryRequestStatus status) {
        List<CategoryRequest> requests = status == null
                ? categoryRequestRepository.findAllByOrderByCreatedAtDesc()
                : categoryRequestRepository.findByStatusOrderByCreatedAtDesc(status);
        return requests.stream().map(this::toDto).toList();
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryRequestDto approveRequest(User reviewer, java.util.UUID requestId, CategoryRequestDecisionRequest decision) {
        CategoryRequest request = categoryRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category request not found"));

        if (request.getStatus() != CategoryRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending requests can be approved");
        }

        if (categoryRepository.findBySlug(request.getSlug()).isEmpty()) {
            Category category = Category.builder()
                    .name(request.getName())
                    .slug(request.getSlug())
                    .description("Community requested category")
                    .build();
            categoryRepository.save(category);
        }

        request.setStatus(CategoryRequestStatus.APPROVED);
        request.setReviewedBy(reviewer);
        request.setReviewNote(normalizeOptional(decision != null ? decision.getNote() : null));
        request.setReviewedAt(LocalDateTime.now());
        CategoryRequest saved = categoryRequestRepository.save(request);

        notificationService.createNotification(
                request.getRequestedBy(),
                NotificationType.CATEGORY_REQUEST_APPROVED,
                "Category request approved",
                "Your category request for \"" + request.getName() + "\" was approved.",
                "/editor"
        );

        return toDto(saved);
    }

    @Transactional
    public CategoryRequestDto rejectRequest(User reviewer, java.util.UUID requestId, CategoryRequestDecisionRequest decision) {
        CategoryRequest request = categoryRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category request not found"));

        if (request.getStatus() != CategoryRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending requests can be rejected");
        }

        request.setStatus(CategoryRequestStatus.REJECTED);
        request.setReviewedBy(reviewer);
        request.setReviewNote(normalizeOptional(decision != null ? decision.getNote() : null));
        request.setReviewedAt(LocalDateTime.now());
        CategoryRequest saved = categoryRequestRepository.save(request);

        String note = normalizeOptional(decision != null ? decision.getNote() : null);
        notificationService.createNotification(
                request.getRequestedBy(),
                NotificationType.CATEGORY_REQUEST_REJECTED,
                "Category request rejected",
                "Your category request for \"" + request.getName() + "\" was rejected." + (note != null ? " Note: " + note : ""),
                "/editor"
        );

        return toDto(saved);
    }

    private CategoryRequestDto toDto(CategoryRequest request) {
        return CategoryRequestDto.builder()
                .id(request.getId())
                .name(request.getName())
                .slug(request.getSlug())
                .reason(request.getReason())
                .status(request.getStatus())
                .requestedById(request.getRequestedBy().getId())
                .requestedByName(request.getRequestedBy().getDisplayName())
                .requestedByEmail(request.getRequestedBy().getEmail())
                .reviewedById(request.getReviewedBy() != null ? request.getReviewedBy().getId() : null)
                .reviewedByName(request.getReviewedBy() != null ? request.getReviewedBy().getDisplayName() : null)
                .reviewNote(request.getReviewNote())
                .createdAt(request.getCreatedAt())
                .reviewedAt(request.getReviewedAt())
                .build();
    }

    private String normalizeName(String input) {
        String trimmed = input == null ? "" : input.trim();
        if (trimmed.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category name is required");
        }
        String[] tokens = trimmed.replaceAll("\\s+", " ").split(" ");
        StringBuilder normalized = new StringBuilder();
        for (int i = 0; i < tokens.length; i++) {
            String token = tokens[i];
            if (token.isBlank()) continue;
            if (i > 0 && normalized.length() > 0) normalized.append(" ");
            normalized.append(token.substring(0, 1).toUpperCase(Locale.ENGLISH))
                    .append(token.substring(1).toLowerCase(Locale.ENGLISH));
        }
        String result = normalized.toString().trim();
        if (result.isEmpty()) {
            throw new RuntimeException("Category name is required");
        }
        return result;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
