package com.blog.blogbackend.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryRequestDecisionRequest {
    @Size(max = 1000, message = "Review note must not exceed 1000 characters")
    private String note;
}
