package com.blog.blogbackend.service;

import com.blog.blogbackend.dto.AuthorStatsResponse;
import com.blog.blogbackend.dto.CategoryDto;
import com.blog.blogbackend.dto.PostRequest;
import com.blog.blogbackend.dto.PostResponse;
import com.blog.blogbackend.dto.TagDto;
import com.blog.blogbackend.entity.*;
import com.blog.blogbackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PostService {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private CommentRepository commentRepository;
    
    @Autowired
    private SavedPostRepository savedPostRepository;

    @Autowired
    private SlugService slugService;

    @Transactional
    @CacheEvict(value = "rss-feed", allEntries = true)
    public PostResponse createPost(PostRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User author = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Post post = Post.builder()
                .title(request.getTitle())
                .slug(slugService.generateSlug(request.getTitle()))
                .content(request.getContent())
                .excerpt(request.getExcerpt())
                .coverImageUrl(normalizeOptionalValue(request.getCoverImageUrl()))
                .status(PostStatus.DRAFT)
                .author(author)
                .build();

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId()).orElse(null);
            post.setCategory(category);
        }

        if (request.getTags() != null) {
            Set<Tag> tags = request.getTags().stream().map(tagName -> {
                String slug = slugService.slugify(tagName);
                return tagRepository.findBySlug(slug).orElseGet(() -> {
                    Tag newTag = Tag.builder().name(tagName).slug(slug).build();
                    return tagRepository.save(newTag);
                });
            }).collect(Collectors.toSet());
            post.setTags(tags);
        }

        return mapToResponse(postRepository.save(post));
    }

    @Transactional
    @CacheEvict(value = "rss-feed", allEntries = true)
    public PostResponse updatePost(UUID id, PostRequest request) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
        User currentUser = getCurrentUser();
        assertCanManagePost(post, currentUser);

        if (!post.getTitle().equals(request.getTitle())) {
            post.setTitle(request.getTitle());
            post.setSlug(slugService.generateSlug(request.getTitle()));
        }
        post.setContent(request.getContent());
        post.setExcerpt(request.getExcerpt());
        post.setCoverImageUrl(normalizeOptionalValue(request.getCoverImageUrl()));

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId()).orElse(null);
            post.setCategory(category);
        }

        if (request.getTags() != null) {
            Set<Tag> tags = request.getTags().stream().map(tagName -> {
                String slug = slugService.slugify(tagName);
                return tagRepository.findBySlug(slug).orElseGet(() -> {
                    Tag newTag = Tag.builder().name(tagName).slug(slug).build();
                    return tagRepository.save(newTag);
                });
            }).collect(Collectors.toSet());
            post.setTags(tags);
        }

        return mapToResponse(postRepository.save(post));
    }

    @Transactional
    @CacheEvict(value = "rss-feed", allEntries = true)
    public PostResponse publishPost(UUID id) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
        User currentUser = getCurrentUser();
        assertCanManagePost(post, currentUser);

        post.setStatus(PostStatus.PUBLISHED);
        post.setPublishedAt(LocalDateTime.now());
        return mapToResponse(postRepository.save(post));
    }

    @Transactional
    @CacheEvict(value = "rss-feed", allEntries = true)
    public PostResponse unpublishPost(UUID id) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
        User currentUser = getCurrentUser();
        assertCanManagePost(post, currentUser);

        post.setStatus(PostStatus.DRAFT);
        return mapToResponse(postRepository.save(post));
    }

    @Transactional
    @CacheEvict(value = "rss-feed", allEntries = true)
    public void deletePost(UUID id) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
        User currentUser = getCurrentUser();
        assertCanManagePost(post, currentUser);
        postRepository.delete(post);
    }

    public PostResponse getPostForEdit(UUID id) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
        User currentUser = getCurrentUser();
        assertCanManagePost(post, currentUser);
        return mapToResponse(post, currentUser);
    }

    public PostResponse getPostBySlug(String slug) {
        Post post = postRepository.findBySlug(slug).orElseThrow(() -> new RuntimeException("Post not found"));
        // If draft, only author/admin can see
        if (post.getStatus() == PostStatus.DRAFT) {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            if (email.equals("anonymousUser")) throw new RuntimeException("Post not found");
            User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
            if (!post.getAuthor().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
                throw new RuntimeException("Post not found");
            }
        }
        return mapToResponse(post);
    }

    public Page<PostResponse> getPublishedPosts(String tag, String category, Pageable pageable) {
        Page<Post> posts;
        if (tag != null) {
            posts = postRepository.findByTagSlug(tag, pageable);
        } else if (category != null) {
            posts = postRepository.findByCategorySlug(category, pageable);
        } else {
            posts = postRepository.findByStatus(PostStatus.PUBLISHED, pageable);
        }
        return posts.map(this::mapToResponse);
    }

    public Page<PostResponse> searchPosts(String q, String sort, Pageable pageable) {
        String normalizedSort = sort == null ? "relevance" : sort.trim().toLowerCase();
        Page<Post> posts = switch (normalizedSort) {
            case "latest" -> postRepository.fullTextSearchLatest(q, pageable);
            case "oldest" -> postRepository.fullTextSearchOldest(q, pageable);
            default -> postRepository.fullTextSearchByRelevance(q, pageable);
        };
        return posts.map(this::mapToResponse);
    }
    
    public Page<PostResponse> getAuthorPosts(Pageable pageable) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User author = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return postRepository.findByAuthorId(author.getId(), pageable)
                .map(this::mapToResponse);
    }

    public AuthorStatsResponse getAuthorStats() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User author = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        
        long totalPosts = postRepository.countByAuthorId(author.getId());
        long publishedPosts = postRepository.countByAuthorIdAndStatus(author.getId(), PostStatus.PUBLISHED);
        long totalComments = commentRepository.countByAuthorId(author.getId());

        return AuthorStatsResponse.builder()
                .totalPosts(totalPosts)
                .publishedPosts(publishedPosts)
                .totalComments(totalComments)
                .build();
    }

    @Transactional
    public void toggleSave(UUID postId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
        User user = getCurrentUser();
        
        savedPostRepository.findByUserAndPost(user, post).ifPresentOrElse(
            savedPostRepository::delete,
            () -> savedPostRepository.save(SavedPost.builder().user(user).post(post).build())
        );
    }

    private PostResponse mapToResponse(Post post) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = null;
        if (!email.equals("anonymousUser")) {
            currentUser = userRepository.findByEmail(email).orElse(null);
        }
        return mapToResponse(post, currentUser);
    }

    private PostResponse mapToResponse(Post post, User user) {
        boolean isSaved = false;
        if (user != null) {
            isSaved = savedPostRepository.existsByUserAndPost(user, post);
        }

        return PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .content(post.getContent())
                .excerpt(post.getExcerpt())
                .coverImageUrl(post.getCoverImageUrl())
                .status(post.getStatus())
                .publishedAt(post.getPublishedAt())
                .authorId(post.getAuthor().getId())
                .authorName(post.getAuthor().getDisplayName())
                .createdAt(post.getCreatedAt())
                .isSaved(isSaved)
                .category(post.getCategory() != null ? CategoryDto.builder()
                        .id(post.getCategory().getId())
                        .name(post.getCategory().getName())
                        .slug(post.getCategory().getSlug())
                        .description(post.getCategory().getDescription())
                        .build() : null)
                .tags(post.getTags().stream().map(tag -> TagDto.builder()
                        .id(tag.getId())
                        .name(tag.getName())
                        .slug(tag.getSlug())
                        .build()).collect(Collectors.toSet()))
                .build();
    }

    private String normalizeOptionalValue(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void assertCanManagePost(Post post, User currentUser) {
        if (!post.getAuthor().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Unauthorized");
        }
    }
}
