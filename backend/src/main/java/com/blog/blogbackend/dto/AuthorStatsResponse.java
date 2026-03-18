package com.blog.blogbackend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthorStatsResponse {
    private long totalPosts;
    private long publishedPosts;
    private long totalComments;
}
