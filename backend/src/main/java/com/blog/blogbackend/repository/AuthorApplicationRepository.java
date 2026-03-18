package com.blog.blogbackend.repository;

import com.blog.blogbackend.entity.AuthorApplication;
import com.blog.blogbackend.entity.AuthorApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuthorApplicationRepository extends JpaRepository<AuthorApplication, UUID> {
    List<AuthorApplication> findByUserId(UUID userId);
    List<AuthorApplication> findByStatus(AuthorApplicationStatus status);
    boolean existsByUserIdAndStatus(UUID userId, AuthorApplicationStatus status);
}
