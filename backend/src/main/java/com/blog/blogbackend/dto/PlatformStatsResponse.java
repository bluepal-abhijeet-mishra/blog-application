package com.blog.blogbackend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlatformStatsResponse {
    private long totalUsers;
    private long totalPosts;
    private long totalComments;
    private long authorCount;
}
