package com.blog.blogbackend.dto;

import com.blog.blogbackend.entity.CategoryRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryRequestDto {
    private UUID id;
    private String name;
    private String slug;
    private String reason;
    private CategoryRequestStatus status;
    private UUID requestedById;
    private String requestedByName;
    private String requestedByEmail;
    private UUID reviewedById;
    private String reviewedByName;
    private String reviewNote;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
}
