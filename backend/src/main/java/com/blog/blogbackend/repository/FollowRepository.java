package com.blog.blogbackend.repository;

import com.blog.blogbackend.entity.Follow;
import com.blog.blogbackend.entity.FollowId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FollowRepository extends JpaRepository<Follow, FollowId> {
    
    long countByFollowingId(UUID followingId);
    
    boolean existsByFollowerIdAndFollowingId(UUID followerId, UUID followingId);
    
    void deleteByFollowerIdAndFollowingId(UUID followerId, UUID followingId);
}
