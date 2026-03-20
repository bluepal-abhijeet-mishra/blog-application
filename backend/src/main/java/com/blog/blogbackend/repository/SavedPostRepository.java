package com.blog.blogbackend.repository;

import com.blog.blogbackend.entity.Post;
import com.blog.blogbackend.entity.SavedPost;
import com.blog.blogbackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedPostRepository extends JpaRepository<SavedPost, UUID> {
    Optional<SavedPost> findByUserAndPost(User user, Post post);
    boolean existsByUserAndPost(User user, Post post);
    void deleteByUserAndPost(User user, Post post);
    long countByPostId(UUID postId);
}
