package com.blog.blogbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
    
    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 255, message = "Title must be between 1 and 255 characters")
    private String title;
    
    @NotBlank(message = "Content is required")
    @Size(min = 1, max = 50000, message = "Content must not exceed 50,000 characters")
    private String content;
    
    @Size(max = 300, message = "Excerpt must not exceed 300 characters")
    private String excerpt;
    
    private UUID categoryId;
    
    private Set<String> tags; // Names of tags
}
