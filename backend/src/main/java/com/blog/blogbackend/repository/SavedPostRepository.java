package com.blog.blogbackend.repository;

import com.blog.blogbackend.entity.Post;
import com.blog.blogbackend.entity.PostStatus;
import com.blog.blogbackend.entity.SavedPost;
import com.blog.blogbackend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedPostRepository extends JpaRepository<SavedPost, UUID> {
    Page<SavedPost> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    @Query(
            value = """
                    SELECT sp FROM SavedPost sp
                    JOIN sp.post p
                    JOIN p.author a
                    WHERE sp.user = :user
                      AND (p.status = :publishedStatus OR a.id = :currentUserId OR :includeAll = true)
                    ORDER BY sp.createdAt DESC
                    """,
            countQuery = """
                    SELECT COUNT(sp) FROM SavedPost sp
                    JOIN sp.post p
                    JOIN p.author a
                    WHERE sp.user = :user
                      AND (p.status = :publishedStatus OR a.id = :currentUserId OR :includeAll = true)
                    """
    )
    Page<SavedPost> findVisibleSavedPosts(
            @Param("user") User user,
            @Param("currentUserId") UUID currentUserId,
            @Param("publishedStatus") PostStatus publishedStatus,
            @Param("includeAll") boolean includeAll,
            Pageable pageable
    );

    Optional<SavedPost> findByUserIdAndPostId(UUID userId, UUID postId);
    boolean existsByUserIdAndPostId(UUID userId, UUID postId);
    void deleteByUserIdAndPostId(UUID userId, UUID postId);
    long countByPostId(UUID postId);
}
