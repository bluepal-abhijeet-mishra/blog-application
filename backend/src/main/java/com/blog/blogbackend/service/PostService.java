package com.blog.blogbackend.service;

import com.blog.blogbackend.dto.AuthorStatsResponse;
import com.blog.blogbackend.dto.CategoryDto;
import com.blog.blogbackend.dto.PostRequest;
import com.blog.blogbackend.dto.PostResponse;
import com.blog.blogbackend.dto.TagDto;
import com.blog.blogbackend.entity.*;
import com.blog.blogbackend.repository.CategoryRepository;
import com.blog.blogbackend.repository.CommentRepository;
import com.blog.blogbackend.repository.PostRepository;
import com.blog.blogbackend.repository.TagRepository;
import com.blog.blogbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
    private SlugService slugService;

    @Transactional
    public PostResponse createPost(PostRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User author = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Post post = Post.builder()
                .title(request.getTitle())
                .slug(slugService.generateSlug(request.getTitle()))
                .content(request.getContent())
                .excerpt(request.getExcerpt())
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
    public PostResponse updatePost(UUID id, PostRequest request) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));

        // Authorization check
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        if (!post.getAuthor().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Unauthorized");
        }

        if (!post.getTitle().equals(request.getTitle())) {
            post.setTitle(request.getTitle());
            post.setSlug(slugService.generateSlug(request.getTitle()));
        }
        post.setContent(request.getContent());
        post.setExcerpt(request.getExcerpt());

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
    public PostResponse publishPost(UUID id) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        if (!post.getAuthor().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Unauthorized");
        }

        post.setStatus(PostStatus.PUBLISHED);
        post.setPublishedAt(LocalDateTime.now());
        return mapToResponse(postRepository.save(post));
    }

    @Transactional
    public PostResponse unpublishPost(UUID id) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        if (!post.getAuthor().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Unauthorized");
        }

        post.setStatus(PostStatus.DRAFT);
        // We keep publishedAt as a record of when it was first/last published, or clear it. 
        // PRD doesn't specify, but DRAFT usually means not publicly visible.
        return mapToResponse(postRepository.save(post));
    }

    public void deletePost(UUID id) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        if (!post.getAuthor().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Unauthorized");
        }
        postRepository.delete(post);
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

    public Page<PostResponse> searchPosts(String q, Pageable pageable) {
        return postRepository.fullTextSearch(q, pageable).map(this::mapToResponse);
    }

    public List<PostResponse> getAuthorPosts() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User author = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return postRepository.findByAuthorId(author.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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

    private PostResponse mapToResponse(Post post) {
        return PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .content(post.getContent())
                .excerpt(post.getExcerpt())
                .status(post.getStatus())
                .publishedAt(post.getPublishedAt())
                .authorId(post.getAuthor().getId())
                .authorName(post.getAuthor().getDisplayName())
                .createdAt(post.getCreatedAt())
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
}
