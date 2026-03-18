package com.blog.blogbackend.repository;

import com.blog.blogbackend.entity.CategoryRequest;
import com.blog.blogbackend.entity.CategoryRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface CategoryRequestRepository extends JpaRepository<CategoryRequest, UUID> {
    boolean existsBySlugAndStatusIn(String slug, Collection<CategoryRequestStatus> statuses);

    List<CategoryRequest> findByRequestedByIdOrderByCreatedAtDesc(UUID requestedById);

    List<CategoryRequest> findByStatusOrderByCreatedAtDesc(CategoryRequestStatus status);

    List<CategoryRequest> findAllByOrderByCreatedAtDesc();
}
