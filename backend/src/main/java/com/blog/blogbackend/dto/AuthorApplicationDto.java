package com.blog.blogbackend.dto;

import com.blog.blogbackend.entity.AuthorApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthorApplicationDto {
    private UUID id;
    private UUID userId;
    private String userDisplayName;
    private String userEmail;
    private String bio;
    private AuthorApplicationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime evaluatedAt;
    private String rejectionReason;
}
