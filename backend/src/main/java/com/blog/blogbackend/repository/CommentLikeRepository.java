package com.blog.blogbackend.repository;

import com.blog.blogbackend.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, UUID> {
    Optional<CommentLike> findByCommentIdAndUserId(UUID commentId, UUID userId);
    long countByCommentId(UUID commentId);
    boolean existsByCommentIdAndUserId(UUID commentId, UUID userId);
    
    java.util.List<CommentLike> findTop20ByCommentIdOrderByCreatedAtDesc(UUID commentId);
}
