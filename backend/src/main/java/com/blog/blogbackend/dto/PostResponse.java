package com.blog.blogbackend.dto;

import com.blog.blogbackend.entity.PostStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PostResponse {
    private UUID id;
    private String title;
    private String slug;
    private String content;
    private String excerpt;
    private String coverImageUrl;
    private PostStatus status;
    private LocalDateTime publishedAt;
    private String authorName;
    private UUID authorId;
    private CategoryDto category;
    private Set<TagDto> tags;
    private LocalDateTime createdAt;
}
