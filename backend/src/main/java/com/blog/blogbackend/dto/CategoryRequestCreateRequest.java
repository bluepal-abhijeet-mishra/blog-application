package com.blog.blogbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryRequestCreateRequest {
    @NotBlank(message = "Category name is required")
    @Size(min = 2, max = 120, message = "Category name must be between 2 and 120 characters")
    private String name;

    @Size(max = 1000, message = "Reason must not exceed 1000 characters")
    private String reason;
}
