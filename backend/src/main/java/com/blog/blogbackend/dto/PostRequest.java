package com.blog.blogbackend.dto;

import com.blog.blogbackend.entity.PostStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PostRequest {
    private String title;
    private String content;
    private String excerpt;
    private UUID categoryId;
    private Set<String> tags; // Names of tags
}
