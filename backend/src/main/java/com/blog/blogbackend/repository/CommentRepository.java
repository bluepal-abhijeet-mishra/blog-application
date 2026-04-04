package com.blog.blogbackend.repository;

import com.blog.blogbackend.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    Page<Comment> findByPostIdAndParentIsNull(UUID postId, Pageable pageable);
    List<Comment> findByParentId(UUID parentId);
    long countByPostId(UUID postId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(c) FROM Comment c WHERE c.post.author.id = :authorId")
    long countByAuthorId(@org.springframework.data.repository.query.Param("authorId") UUID authorId);
}
