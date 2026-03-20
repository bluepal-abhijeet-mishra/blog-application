package com.blog.blogbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommentResponse {
    private UUID id;
    private String content;
    private String authorName;
    private UUID authorId;
    private String authorAvatarUrl;
    private LocalDateTime createdAt;
    private List<CommentResponse> replies;
    private long likeCount;
    private boolean likedByCurrentUser;
}
