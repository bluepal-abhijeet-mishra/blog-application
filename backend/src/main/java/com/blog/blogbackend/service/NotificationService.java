package com.blog.blogbackend.service;

import com.blog.blogbackend.dto.NotificationDto;
import com.blog.blogbackend.entity.Notification;
import com.blog.blogbackend.entity.NotificationType;
import com.blog.blogbackend.entity.Role;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.NotificationRepository;
import com.blog.blogbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createNotification(User recipient, NotificationType type, String title, String message, String link) {
        if (recipient == null) {
            return;
        }
        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .link(normalizeLink(link))
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void createNotificationForAdmins(NotificationType type, String title, String message, String link) {
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            createNotification(admin, type, title, message, link);
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getNotifications(User user, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        return notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, safeLimit))
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getUnreadCount(User user) {
        long count = notificationRepository.countByRecipientIdAndIsReadFalse(user.getId());
        return Map.of("count", count);
    }

    @Transactional
    public NotificationDto markAsRead(User user, UUID notificationId) {
        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, user.getId())
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
        return toDto(notification);
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> unread = notificationRepository.findByRecipientIdAndIsReadFalse(user.getId());
        LocalDateTime now = LocalDateTime.now();
        for (Notification notification : unread) {
            notification.setRead(true);
            notification.setReadAt(now);
        }
        notificationRepository.saveAll(unread);
    }

    private NotificationDto toDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .link(notification.getLink())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .build();
    }

    private String normalizeLink(String link) {
        if (link == null) return null;
        String trimmed = link.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
