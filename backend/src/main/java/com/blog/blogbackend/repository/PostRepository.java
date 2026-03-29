package com.blog.blogbackend.repository;

import com.blog.blogbackend.entity.Post;
import com.blog.blogbackend.entity.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {
    Optional<Post> findBySlug(String slug);
    boolean existsBySlug(String slug);

    Page<Post> findByStatus(PostStatus status, Pageable pageable);
    List<Post> findTop20ByStatusOrderByPublishedAtDesc(PostStatus status);

    Page<Post> findByAuthorId(UUID authorId, Pageable pageable);
    List<Post> findAllByAuthorId(UUID authorId);
    Page<Post> findByAuthorIdAndStatus(UUID authorId, PostStatus status, Pageable pageable);

    @Query("SELECT p FROM Post p JOIN p.tags t WHERE t.slug = :tagSlug AND p.status = 'PUBLISHED'")
    Page<Post> findByTagSlug(@Param("tagSlug") String tagSlug, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.category.slug = :categorySlug AND p.status = 'PUBLISHED'")
    Page<Post> findByCategorySlug(@Param("categorySlug") String categorySlug, Pageable pageable);

    @Query(
            value = "SELECT * FROM posts " +
                    "WHERE search_vector @@ plainto_tsquery('english', :q) AND status = 'PUBLISHED' " +
                    "ORDER BY ts_rank(search_vector, plainto_tsquery('english', :q)) DESC, published_at DESC",
            countQuery = "SELECT COUNT(*) FROM posts WHERE search_vector @@ plainto_tsquery('english', :q) AND status = 'PUBLISHED'",
            nativeQuery = true
    )
    Page<Post> fullTextSearchByRelevance(@Param("q") String q, Pageable pageable);

    @Query(
            value = "SELECT * FROM posts " +
                    "WHERE search_vector @@ plainto_tsquery('english', :q) AND status = 'PUBLISHED' " +
                    "ORDER BY published_at DESC",
            countQuery = "SELECT COUNT(*) FROM posts WHERE search_vector @@ plainto_tsquery('english', :q) AND status = 'PUBLISHED'",
            nativeQuery = true
    )
    Page<Post> fullTextSearchLatest(@Param("q") String q, Pageable pageable);

    @Query(
            value = "SELECT * FROM posts " +
                    "WHERE search_vector @@ plainto_tsquery('english', :q) AND status = 'PUBLISHED' " +
                    "ORDER BY published_at ASC",
            countQuery = "SELECT COUNT(*) FROM posts WHERE search_vector @@ plainto_tsquery('english', :q) AND status = 'PUBLISHED'",
            nativeQuery = true
    )
    Page<Post> fullTextSearchOldest(@Param("q") String q, Pageable pageable);

    long countByAuthorId(UUID authorId);
    long countByAuthorIdAndStatus(UUID authorId, PostStatus status);
}
