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
    private java.util.List<MonthlyTrend> userGrowth;
    private java.util.List<MonthlyTrend> postActivity;
    private java.util.Map<String, Long> categoryDistribution;
    private java.util.Map<String, Long> roleDistribution;

}
