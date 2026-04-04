package com.blog.blogbackend.service;

import com.blog.blogbackend.dto.NotificationDto;
import com.blog.blogbackend.entity.Notification;
import com.blog.blogbackend.entity.NotificationType;
import com.blog.blogbackend.entity.Role;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.NotificationRepository;
import com.blog.blogbackend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void createNotificationShouldSave() {
        User recipient = testUser();

        notificationService.createNotification(
                recipient, NotificationType.COMMENT_ON_POST, "New Comment", "Someone commented", "/posts/test"
        );

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void createNotificationShouldSkipWhenRecipientIsNull() {
        notificationService.createNotification(
                null, NotificationType.COMMENT_ON_POST, "Title", "Message", "/link"
        );

        verify(notificationRepository, never()).save(any());
    }

    @Test
    void createNotificationForAdminsShouldNotifyAllAdmins() {
        User admin1 = testUser();
        User admin2 = testUser();
        when(userRepository.findByRole(Role.ADMIN)).thenReturn(List.of(admin1, admin2));

        notificationService.createNotificationForAdmins(
                NotificationType.AUTHOR_APPLICATION_SUBMITTED, "New Application", "User applied", "/admin"
        );

        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    @Test
    void getNotificationsShouldReturnDtoList() {
        User user = testUser();
        Notification notification = testNotification(user);
        when(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(eq(user.getId()), any(PageRequest.class)))
                .thenReturn(List.of(notification));

        List<NotificationDto> result = notificationService.getNotifications(user, 10);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test Title", result.get(0).getTitle());
    }

    @Test
    void getNotificationsShouldClampLimit() {
        User user = testUser();
        when(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(eq(user.getId()), any(PageRequest.class)))
                .thenReturn(Collections.emptyList());

        List<NotificationDto> result = notificationService.getNotifications(user, 100);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getUnreadCountShouldReturnMap() {
        User user = testUser();
        when(notificationRepository.countByRecipientIdAndIsReadFalse(user.getId())).thenReturn(5L);

        Map<String, Long> result = notificationService.getUnreadCount(user);

        assertEquals(5L, result.get("count"));
    }

    @Test
    void markAsReadShouldMarkUnreadNotification() {
        User user = testUser();
        UUID notifId = UUID.randomUUID();
        Notification notification = testNotification(user);
        notification.setId(notifId);
        notification.setRead(false);

        when(notificationRepository.findByIdAndRecipientId(notifId, user.getId()))
                .thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

        NotificationDto result = notificationService.markAsRead(user, notifId);

        assertNotNull(result);
        assertTrue(notification.isRead());
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsReadShouldThrowIfNotFound() {
        User user = testUser();
        UUID notifId = UUID.randomUUID();
        when(notificationRepository.findByIdAndRecipientId(notifId, user.getId()))
                .thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> notificationService.markAsRead(user, notifId));
    }

    @Test
    void markAllAsReadShouldUpdateAllUnread() {
        User user = testUser();
        Notification n1 = testNotification(user);
        Notification n2 = testNotification(user);
        when(notificationRepository.findByRecipientIdAndIsReadFalse(user.getId()))
                .thenReturn(List.of(n1, n2));

        notificationService.markAllAsRead(user);

        assertTrue(n1.isRead());
        assertTrue(n2.isRead());
        verify(notificationRepository).saveAll(any());
    }

    @Test
    void createNotificationShouldNormalizeLinkWithSpaces() {
        User recipient = testUser();

        notificationService.createNotification(
                recipient, NotificationType.COMMENT_ON_POST, "Title", "Message", "  /posts/test  "
        );

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void createNotificationShouldHandleEmptyLink() {
        User recipient = testUser();

        notificationService.createNotification(
                recipient, NotificationType.COMMENT_ON_POST, "Title", "Message", "   "
        );

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void createNotificationShouldHandleNullLink() {
        User recipient = testUser();

        notificationService.createNotification(
                recipient, NotificationType.COMMENT_ON_POST, "Title", "Message", null
        );

        verify(notificationRepository).save(any(Notification.class));
    }

    private User testUser() {
        return User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .displayName("Test User")
                .role(Role.READER)
                .build();
    }

    private Notification testNotification(User user) {
        return Notification.builder()
                .id(UUID.randomUUID())
                .recipient(user)
                .type(NotificationType.COMMENT_ON_POST)
                .title("Test Title")
                .message("Test Message")
                .link("/test-link")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
