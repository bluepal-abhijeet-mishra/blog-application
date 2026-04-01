package com.blog.blogbackend.service;

import com.blog.blogbackend.dto.CommentRequest;
import com.blog.blogbackend.dto.CommentResponse;
import com.blog.blogbackend.entity.*;
import com.blog.blogbackend.repository.CommentLikeRepository;
import com.blog.blogbackend.repository.CommentRepository;
import com.blog.blogbackend.repository.PostRepository;
import com.blog.blogbackend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private CommentLikeRepository commentLikeRepository;

    @InjectMocks
    private CommentService commentService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void addCommentShouldSaveAndReturnResponse() {
        UUID postId = UUID.randomUUID();
        User user = testUser("user@example.com");
        Post post = testPost(postId, PostStatus.PUBLISHED);
        authenticate(user.getEmail());
        CommentRequest request = new CommentRequest("This is a comment", null);

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment c = invocation.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        CommentResponse response = commentService.addComment(postId, request);

        assertNotNull(response);
        assertEquals("This is a comment", response.getContent());
        verify(commentRepository).save(any(Comment.class));
        verify(notificationService).createNotification(any(), any(), any(), any(), any());
    }

    @Test
    void addCommentShouldThrowIfPostUnpublished() {
        UUID postId = UUID.randomUUID();
        User user = testUser("user@example.com");
        Post post = testPost(postId, PostStatus.DRAFT);
        authenticate(user.getEmail());
        CommentRequest request = new CommentRequest("This is a comment", null);

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> commentService.addComment(postId, request));
        assertEquals("Cannot comment on unpublished post", exception.getMessage());
    }

    @Test
    void toggleLikeShouldDeleteIfAlreadyLiked() {
        UUID commentId = UUID.randomUUID();
        User user = testUser("user@example.com");
        Comment comment = testComment(commentId, testPost(UUID.randomUUID(), PostStatus.PUBLISHED));
        authenticate(user.getEmail());

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));
        when(commentLikeRepository.findByCommentIdAndUserId(commentId, user.getId())).thenReturn(Optional.of(new CommentLike()));

        commentService.toggleLike(commentId);

        verify(commentLikeRepository).delete(any());
    }

    @Test
    void toggleLikeShouldSaveIfNotAlreadyLiked() {
        UUID commentId = UUID.randomUUID();
        User user = testUser("user@example.com");
        Comment comment = testComment(commentId, testPost(UUID.randomUUID(), PostStatus.PUBLISHED));
        authenticate(user.getEmail());

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));
        when(commentLikeRepository.findByCommentIdAndUserId(commentId, user.getId())).thenReturn(Optional.empty());

        commentService.toggleLike(commentId);

        verify(commentLikeRepository).save(any(CommentLike.class));
    }

    @Test
    void getCommentsForPostShouldReturnPage() {
        UUID postId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 10);
        Comment comment = testComment(UUID.randomUUID(), testPost(postId, PostStatus.PUBLISHED));
        Page<Comment> page = new PageImpl<>(Collections.singletonList(comment));

        when(commentRepository.findByPostIdAndParentIsNull(postId, pageable)).thenReturn(page);
        when(commentRepository.findByParentId(any())).thenReturn(Collections.emptyList());

        Page<CommentResponse> result = commentService.getCommentsForPost(postId, pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(comment.getContent(), result.getContent().get(0).getContent());
    }

    @Test
    void deleteCommentShouldSucceedForAuthor() {
        UUID commentId = UUID.randomUUID();
        User user = testUser("user@example.com");
        Comment comment = testComment(commentId, testPost(UUID.randomUUID(), PostStatus.PUBLISHED));
        comment.setUser(user);
        authenticate(user.getEmail());

        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        commentService.deleteComment(commentId);

        verify(commentRepository).delete(comment);
    }

    @Test
    void deleteCommentShouldThrowIfUnauthorized() {
        UUID commentId = UUID.randomUUID();
        User user = testUser("user@example.com");
        User otherUser = testUser("other@example.com");
        Comment comment = testComment(commentId, testPost(UUID.randomUUID(), PostStatus.PUBLISHED));
        comment.setUser(otherUser);
        authenticate(user.getEmail());

        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> commentService.deleteComment(commentId));
        assertEquals("Unauthorized", exception.getMessage());
    }

    private void authenticate(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, "password")
        );
    }

    private User testUser(String email) {
        return User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .displayName("Test User")
                .role(Role.READER)
                .build();
    }

    private Post testPost(UUID id, PostStatus status) {
        return Post.builder()
                .id(id)
                .title("Test Post")
                .status(status)
                .author(testUser("author@example.com"))
                .build();
    }

    private Comment testComment(UUID id, Post post) {
        return Comment.builder()
                .id(id)
                .content("Comment Content")
                .post(post)
                .user(testUser("commenter@example.com"))
                .build();
    }
}
