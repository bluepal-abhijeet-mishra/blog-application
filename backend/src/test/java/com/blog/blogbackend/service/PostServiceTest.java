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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

        RuntimeException exception = assertThrows(RuntimeException.class, () -> postService.addBookmark(draftPost.getId()));

        verify(savedPostRepository, never()).save(any(SavedPost.class));
        verify(postRepository, never()).save(any(Post.class));
        assertEquals("Post not found", exception.getMessage());
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
