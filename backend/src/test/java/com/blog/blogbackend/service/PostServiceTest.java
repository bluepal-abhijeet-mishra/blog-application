package com.blog.blogbackend.service;

import com.blog.blogbackend.dto.BookmarkResponse;
import com.blog.blogbackend.entity.Post;
import com.blog.blogbackend.entity.PostStatus;
import com.blog.blogbackend.entity.Role;
import com.blog.blogbackend.entity.SavedPost;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.CategoryRepository;
import com.blog.blogbackend.repository.CommentRepository;
import com.blog.blogbackend.repository.PostRepository;
import com.blog.blogbackend.repository.SavedPostRepository;
import com.blog.blogbackend.repository.TagRepository;
import com.blog.blogbackend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.lenient;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import com.blog.blogbackend.dto.PostResponse;
import com.blog.blogbackend.dto.PostRequest;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private SavedPostRepository savedPostRepository;

    @Mock
    private SlugService slugService;

    @InjectMocks
    private PostService postService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void addBookmarkShouldPersistSaveAndIncrementCount() {
        User reader = user("reader@example.com", Role.READER);
        Post post = publishedPost();

        authenticate(reader.getEmail());
        when(userRepository.findByEmail(reader.getEmail())).thenReturn(Optional.of(reader));
        when(postRepository.findById(post.getId())).thenReturn(Optional.of(post));
        when(savedPostRepository.findByUserIdAndPostId(reader.getId(), post.getId())).thenReturn(Optional.empty());

        BookmarkResponse response = postService.addBookmark(post.getId());

        ArgumentCaptor<Post> postCaptor = ArgumentCaptor.forClass(Post.class);
        verify(savedPostRepository).save(any(SavedPost.class));
        verify(postRepository).save(postCaptor.capture());
        assertEquals(1, postCaptor.getValue().getLikeCount());
        assertEquals(true, response.isSaved());
        assertEquals(1, response.getBookmarkCount());
    }

    @Test
    void removeBookmarkShouldDeleteSaveAndDecrementCount() {
        User reader = user("reader@example.com", Role.READER);
        Post post = publishedPost();
        post.setLikeCount(2);
        SavedPost savedPost = SavedPost.builder().user(reader).post(post).build();

        authenticate(reader.getEmail());
        when(userRepository.findByEmail(reader.getEmail())).thenReturn(Optional.of(reader));
        when(postRepository.findById(post.getId())).thenReturn(Optional.of(post));
        when(savedPostRepository.findByUserIdAndPostId(reader.getId(), post.getId())).thenReturn(Optional.of(savedPost));

        BookmarkResponse response = postService.removeBookmark(post.getId());

        ArgumentCaptor<Post> postCaptor = ArgumentCaptor.forClass(Post.class);
        verify(savedPostRepository).delete(savedPost);
        verify(postRepository).save(postCaptor.capture());
        assertEquals(1, postCaptor.getValue().getLikeCount());
        assertEquals(false, response.isSaved());
        assertEquals(1, response.getBookmarkCount());
    }

    @Test
    void addBookmarkShouldRejectDraftPostForReader() {
        User reader = user("reader@example.com", Role.READER);
        Post draftPost = publishedPost();
        draftPost.setStatus(PostStatus.DRAFT);

        authenticate(reader.getEmail());
        when(userRepository.findByEmail(reader.getEmail())).thenReturn(Optional.of(reader));
        when(postRepository.findById(draftPost.getId())).thenReturn(Optional.of(draftPost));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> postService.addBookmark(draftPost.getId()));

        verify(savedPostRepository, never()).save(any(SavedPost.class));
        verify(postRepository, never()).save(any(Post.class));
        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertEquals("Post not found", exception.getReason());
    }

    @Test
    void createPostShouldSavePostAndReturnResponse() {
        User author = user("author@example.com", Role.AUTHOR);
        PostRequest request = PostRequest.builder()
                .title("New Post")
                .content("Content")
                .categoryId(UUID.randomUUID())
                .tags(Collections.emptySet())
                .build();

        authenticate(author.getEmail());
        lenient().when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));
        lenient().when(categoryRepository.findById(any())).thenReturn(Optional.of(com.blog.blogbackend.entity.Category.builder().build()));
        when(slugService.generateSlug(any())).thenReturn("new-post");
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PostResponse response = postService.createPost(request);

        verify(postRepository).save(any(Post.class));
        assertEquals("New Post", response.getTitle());
        assertEquals(PostStatus.DRAFT, response.getStatus());
    }

    @Test
    void createPostWithTagsShouldPersistTags() {
        User author = user("author@example.com", Role.AUTHOR);
        PostRequest request = PostRequest.builder()
                .title("Tagged Post")
                .content("Content")
                .tags(Set.of("Java", "Spring"))
                .build();

        authenticate(author.getEmail());
        when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));
        when(slugService.generateSlug(any())).thenReturn("tagged-post");
        when(slugService.slugify("Java")).thenReturn("java");
        when(slugService.slugify("Spring")).thenReturn("spring");
        when(tagRepository.findBySlug("java")).thenReturn(Optional.empty());
        when(tagRepository.findBySlug("spring")).thenReturn(Optional.of(com.blog.blogbackend.entity.Tag.builder().name("Spring").slug("spring").build()));
        when(tagRepository.save(any(com.blog.blogbackend.entity.Tag.class))).thenAnswer(i -> i.getArgument(0));
        when(postRepository.save(any(Post.class))).thenAnswer(i -> i.getArgument(0));

        PostResponse response = postService.createPost(request);

        verify(tagRepository).save(any(com.blog.blogbackend.entity.Tag.class));
        assertEquals(2, response.getTags().size());
    }

    @Test
    void updatePostShouldModifyExistingPost() {
        User author = user("author@example.com", Role.AUTHOR);
        Post post = publishedPost();
        post.setAuthor(author);
        PostRequest request = PostRequest.builder()
                .title("Updated Title")
                .content("Updated Content")
                .categoryId(UUID.randomUUID())
                .tags(Collections.emptySet())
                .build();

        authenticate(author.getEmail());
        lenient().when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));
        when(postRepository.findById(post.getId())).thenReturn(Optional.of(post));
        lenient().when(categoryRepository.findById(any())).thenReturn(Optional.of(com.blog.blogbackend.entity.Category.builder().build()));
        when(slugService.generateSlug(any())).thenReturn("updated-title");
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PostResponse response = postService.updatePost(post.getId(), request);

        assertEquals("Updated Title", response.getTitle());
        verify(postRepository).save(post);
    }

    @Test
    void updatePostWithTitleChangeShouldUpdateSlug() {
        User author = user("author@example.com", Role.AUTHOR);
        Post post = publishedPost();
        post.setAuthor(author);
        PostRequest request = PostRequest.builder()
                .title("New Title")
                .content("Updated Content")
                .build();

        authenticate(author.getEmail());
        when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));
        when(postRepository.findById(post.getId())).thenReturn(Optional.of(post));
        when(slugService.generateSlug("New Title")).thenReturn("new-title");
        when(postRepository.save(any(Post.class))).thenAnswer(i -> i.getArgument(0));

        PostResponse response = postService.updatePost(post.getId(), request);

        assertEquals("New Title", response.getTitle());
        assertEquals("new-title", response.getSlug());
    }

    @Test
    void updatePostShouldThrowUnauthorizedIfUserIsNotAuthor() {
        User author = user("author@example.com", Role.AUTHOR);
        User otherUser = user("other@example.com", Role.READER);
        Post post = publishedPost();
        post.setAuthor(author);
        PostRequest request = PostRequest.builder().title("Title").build();

        authenticate(otherUser.getEmail());
        when(userRepository.findByEmail(otherUser.getEmail())).thenReturn(Optional.of(otherUser));
        when(postRepository.findById(post.getId())).thenReturn(Optional.of(post));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, 
                () -> postService.updatePost(post.getId(), request));

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());
    }

    @Test
    void publishPostShouldChangeStatusToPublished() {
        User author = user("author@example.com", Role.AUTHOR);
        Post post = publishedPost();
        post.setStatus(PostStatus.DRAFT);
        post.setAuthor(author);

        authenticate(author.getEmail());
        when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));
        when(postRepository.findById(post.getId())).thenReturn(Optional.of(post));
        when(postRepository.save(post)).thenReturn(post);

        PostResponse response = postService.publishPost(post.getId());

        assertEquals(PostStatus.PUBLISHED, response.getStatus());
        verify(postRepository).save(post);
    }

    @Test
    void unpublishPostShouldChangeStatusToDraft() {
        User author = user("author@example.com", Role.AUTHOR);
        Post post = publishedPost();
        post.setAuthor(author);

        authenticate(author.getEmail());
        when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));
        when(postRepository.findById(post.getId())).thenReturn(Optional.of(post));
        when(postRepository.save(post)).thenReturn(post);

        PostResponse response = postService.unpublishPost(post.getId());

        assertEquals(PostStatus.DRAFT, response.getStatus());
        verify(postRepository).save(post);
    }

    @Test
    void deletePostShouldRemovePostFromRepository() {
        User author = user("author@example.com", Role.AUTHOR);
        Post post = publishedPost();
        post.setAuthor(author);

        authenticate(author.getEmail());
        when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));
        when(postRepository.findById(post.getId())).thenReturn(Optional.of(post));

        postService.deletePost(post.getId());

        verify(postRepository).delete(post);
    }

    @Test
    void getPostBySlugShouldReturnPostForAuthorEvenIfDraft() {
        User author = user("author@example.com", Role.AUTHOR);
        Post post = publishedPost();
        post.setStatus(PostStatus.DRAFT);
        post.setAuthor(author);

        authenticate(author.getEmail());
        when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));
        when(postRepository.findBySlug(post.getSlug())).thenReturn(Optional.of(post));

        PostResponse response = postService.getPostBySlug(post.getSlug());

        assertEquals(post.getSlug(), response.getSlug());
    }

    @Test
    void getPostBySlugShouldRejectAnonymousForDraft() {
        Post post = publishedPost();
        post.setStatus(PostStatus.DRAFT);
        authenticate("anonymousUser");

        when(postRepository.findBySlug(post.getSlug())).thenReturn(Optional.of(post));

        assertThrows(ResponseStatusException.class, () -> postService.getPostBySlug(post.getSlug()));
    }

    @Test
    void getPostBySlugShouldRejectNonAuthorForDraft() {
        User author = user("author@example.com", Role.AUTHOR);
        User reader = user("reader@example.com", Role.READER);
        Post post = publishedPost();
        post.setStatus(PostStatus.DRAFT);
        post.setAuthor(author);

        authenticate(reader.getEmail());
        when(userRepository.findByEmail(reader.getEmail())).thenReturn(Optional.of(reader));
        when(postRepository.findBySlug(post.getSlug())).thenReturn(Optional.of(post));

        assertThrows(ResponseStatusException.class, () -> postService.getPostBySlug(post.getSlug()));
    }

    @Test
    void getAuthorStatsShouldReturnCorrectCounts() {
        User author = user("author@example.com", Role.AUTHOR);
        authenticate(author.getEmail());
        when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));
        when(postRepository.countByAuthorId(author.getId())).thenReturn(10L);
        when(postRepository.countByAuthorIdAndStatus(author.getId(), PostStatus.PUBLISHED)).thenReturn(7L);
        when(postRepository.sumLikesByAuthorId(author.getId())).thenReturn(100L);

        var stats = postService.getAuthorStats();

        assertEquals(10L, stats.getTotalPosts());
        assertEquals(7L, stats.getPublishedPosts());
        assertEquals(100L, stats.getTotalLikes());
    }

    @Test
    void searchPostsWithDifferentSorts() {
        when(postRepository.fullTextSearchLatest(any(), any())).thenReturn(org.springframework.data.domain.Page.empty());
        when(postRepository.fullTextSearchOldest(any(), any())).thenReturn(org.springframework.data.domain.Page.empty());
        when(postRepository.fullTextSearchByRelevance(any(), any())).thenReturn(org.springframework.data.domain.Page.empty());

        postService.searchPosts("query", "latest", org.springframework.data.domain.Pageable.unpaged());
        postService.searchPosts("query", "oldest", org.springframework.data.domain.Pageable.unpaged());
        postService.searchPosts("query", "relevance", org.springframework.data.domain.Pageable.unpaged());

        verify(postRepository).fullTextSearchLatest(any(), any());
        verify(postRepository).fullTextSearchOldest(any(), any());
        verify(postRepository).fullTextSearchByRelevance(any(), any());
    }

    @Test
    void exportPostsShouldReturnJsonBytes() {
        User author = user("author@example.com", Role.AUTHOR);
        authenticate(author.getEmail());
        when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));
        when(postRepository.findAllByAuthorId(author.getId())).thenReturn(Collections.emptyList());

        byte[] result = postService.exportAllPostsJson();
        org.junit.jupiter.api.Assertions.assertNotNull(result);
    }

    @Test
    void generateCsvShouldReturnCsvBytes() {
        User author = user("author@example.com", Role.AUTHOR);
        authenticate(author.getEmail());
        when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));
        when(postRepository.findAllByAuthorId(author.getId())).thenReturn(Collections.emptyList());

        byte[] result = postService.generateEngagementCsv();
        org.junit.jupiter.api.Assertions.assertNotNull(result);
    }

    private void authenticate(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, "password")
        );
    }

    private User user(String email, Role role) {
        return User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .role(role)
                .displayName("Reader")
                .build();
    }

    private Post publishedPost() {
        User author = User.builder()
                .id(UUID.randomUUID())
                .email("author@example.com")
                .role(Role.AUTHOR)
                .displayName("Author")
                .build();

        return Post.builder()
                .id(UUID.randomUUID())
                .author(author)
                .title("Test Post")
                .slug("test-post")
                .status(PostStatus.PUBLISHED)
                .likeCount(0)
                .build();
    }
}
