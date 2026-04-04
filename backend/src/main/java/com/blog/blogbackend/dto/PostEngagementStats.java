package com.blog.blogbackend.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class PostEngagementStats {
    private UUID id;
    private String title;
    private long views;
    private long likes;
    private long comments;
    private long shares;
}
