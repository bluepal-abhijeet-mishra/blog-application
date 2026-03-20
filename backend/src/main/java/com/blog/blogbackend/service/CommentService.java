package com.blog.blogbackend.service;

import com.blog.blogbackend.dto.CommentRequest;
import com.blog.blogbackend.dto.CommentResponse;
import com.blog.blogbackend.entity.Comment;
import com.blog.blogbackend.entity.CommentLike;
import com.blog.blogbackend.entity.NotificationType;
import com.blog.blogbackend.entity.Post;
import com.blog.blogbackend.entity.PostStatus;
import com.blog.blogbackend.entity.Role;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.CommentLikeRepository;
import com.blog.blogbackend.repository.CommentRepository;
import com.blog.blogbackend.repository.PostRepository;
import com.blog.blogbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private CommentLikeRepository commentLikeRepository;

    @Transactional
    public CommentResponse addComment(UUID postId, CommentRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
        if (post.getStatus() != PostStatus.PUBLISHED) {
            throw new RuntimeException("Cannot comment on unpublished post");
        }

        Comment comment = Comment.builder()
                .content(request.getContent())
                .post(post)
                .user(user)
                .build();

        if (request.getParentId() != null) {
            Comment parent = commentRepository.findById(request.getParentId()).orElseThrow(() -> new RuntimeException("Parent comment not found"));
            if (!parent.getPost().getId().equals(postId)) {
                throw new RuntimeException("Parent comment does not belong to this post");
            }
            comment.setParent(parent);
        }

        Comment saved = commentRepository.save(comment);
        notifyRelevantUsers(saved, user);
        return mapToResponse(saved, user);
    }

    @Transactional
    public void toggleLike(UUID commentId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new RuntimeException("Comment not found"));

        commentLikeRepository.findByCommentIdAndUserId(commentId, user.getId())
                .ifPresentOrElse(
                        commentLikeRepository::delete,
                        () -> commentLikeRepository.save(CommentLike.builder().comment(comment).user(user).build())
                );
    }

    public Page<CommentResponse> getCommentsForPost(UUID postId, Pageable pageable) {
        String email = SecurityContextHolder.getContext().getAuthentication() != null ? 
                SecurityContextHolder.getContext().getAuthentication().getName() : null;
        User currentUser = email != null ? userRepository.findByEmail(email).orElse(null) : null;

        return commentRepository.findByPostIdAndParentIsNull(postId, pageable)
                .map(comment -> mapToResponseWithReplies(comment, currentUser));
    }

    public void deleteComment(UUID id) {
        Comment comment = commentRepository.findById(id).orElseThrow(() -> new RuntimeException("Comment not found"));
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        boolean isAuthorOfPost = comment.getPost().getAuthor().getId().equals(currentUser.getId());
        boolean isAuthorOfComment = comment.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (isAuthorOfPost || isAuthorOfComment || isAdmin) {
            commentRepository.delete(comment);
        } else {
            throw new RuntimeException("Unauthorized");
        }
    }

    private CommentResponse mapToResponse(Comment comment, User currentUser) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .authorId(comment.getUser().getId())
                .authorName(comment.getUser().getDisplayName())
                .authorAvatarUrl(comment.getUser().getAvatarUrl())
                .createdAt(comment.getCreatedAt())
                .likeCount(commentLikeRepository.countByCommentId(comment.getId()))
                .likedByCurrentUser(currentUser != null && commentLikeRepository.existsByCommentIdAndUserId(comment.getId(), currentUser.getId()))
                .build();
    }

    private CommentResponse mapToResponseWithReplies(Comment comment, User currentUser) {
        CommentResponse response = mapToResponse(comment, currentUser);
        List<Comment> replies = commentRepository.findByParentId(comment.getId());
        response.setReplies(replies.stream()
                .map(reply -> mapToResponseWithReplies(reply, currentUser))
                .collect(Collectors.toList()));
        return response;
    }

    private void notifyRelevantUsers(Comment comment, User actor) {
        Post post = comment.getPost();
        if (!post.getAuthor().getId().equals(actor.getId())) {
            notificationService.createNotification(
                    post.getAuthor(),
                    NotificationType.COMMENT_ON_POST,
                    "New comment on your story",
                    actor.getDisplayName() + " commented on \"" + post.getTitle() + "\".",
                    "/posts/" + post.getSlug()
            );
        }

        Comment parent = comment.getParent();
        if (parent != null && !parent.getUser().getId().equals(actor.getId()) && !parent.getUser().getId().equals(post.getAuthor().getId())) {
            notificationService.createNotification(
                    parent.getUser(),
                    NotificationType.COMMENT_REPLY,
                    "New reply to your comment",
                    actor.getDisplayName() + " replied to your comment on \"" + post.getTitle() + "\".",
                    "/posts/" + post.getSlug()
            );
        }
    }
}
