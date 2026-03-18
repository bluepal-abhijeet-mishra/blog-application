package com.blog.blogbackend.service;

import com.blog.blogbackend.dto.AuthorApplicationDto;
import com.blog.blogbackend.entity.AuthorApplication;
import com.blog.blogbackend.entity.AuthorApplicationStatus;
import com.blog.blogbackend.entity.NotificationType;
import com.blog.blogbackend.entity.Role;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.AuthorApplicationRepository;
import com.blog.blogbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthorApplicationService {

    private final AuthorApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public void submitApplication(User user, AuthorApplicationDto dto) {
        if (applicationRepository.existsByUserIdAndStatus(user.getId(), AuthorApplicationStatus.PENDING)) {
            throw new RuntimeException("You already have a pending application.");
        }

        AuthorApplication application = AuthorApplication.builder()
                .user(user)
                .bio(dto.getBio())
                .status(AuthorApplicationStatus.PENDING)
                .build();

        applicationRepository.save(application);

        notificationService.createNotificationForAdmins(
                NotificationType.AUTHOR_APPLICATION_SUBMITTED,
                "New author application",
                user.getDisplayName() + " submitted an author application.",
                "/admin"
        );
    }

    public List<AuthorApplicationDto> getMyApplications(User user) {
        return applicationRepository.findByUserId(user.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<AuthorApplicationDto> getAllApplications(AuthorApplicationStatus status) {
        List<AuthorApplication> applications = (status != null)
                ? applicationRepository.findByStatus(status)
                : applicationRepository.findAll();

        return applications.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void approveApplication(UUID id) {
        AuthorApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getStatus() != AuthorApplicationStatus.PENDING) {
            throw new RuntimeException("Application is already evaluated.");
        }

        application.setStatus(AuthorApplicationStatus.APPROVED);
        application.setEvaluatedAt(LocalDateTime.now());

        User user = application.getUser();
        user.setRole(Role.AUTHOR);
        userRepository.save(user);

        applicationRepository.save(application);

        notificationService.createNotification(
                user,
                NotificationType.AUTHOR_APPLICATION_APPROVED,
                "Author application approved",
                "Your author application was approved. You can now publish stories.",
                "/dashboard"
        );
    }

    @Transactional
    public void rejectApplication(UUID id, String reason) {
        AuthorApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getStatus() != AuthorApplicationStatus.PENDING) {
            throw new RuntimeException("Application is already evaluated.");
        }

        application.setStatus(AuthorApplicationStatus.REJECTED);
        application.setEvaluatedAt(LocalDateTime.now());
        application.setRejectionReason(reason);

        applicationRepository.save(application);

        notificationService.createNotification(
                application.getUser(),
                NotificationType.AUTHOR_APPLICATION_REJECTED,
                "Author application rejected",
                "Your author application was rejected." + (reason != null && !reason.isBlank() ? " Reason: " + reason : ""),
                "/my-applications"
        );
    }

    private AuthorApplicationDto mapToDto(AuthorApplication application) {
        return AuthorApplicationDto.builder()
                .id(application.getId())
                .userId(application.getUser().getId())
                .userDisplayName(application.getUser().getDisplayName())
                .userEmail(application.getUser().getEmail())
                .bio(application.getBio())
                .status(application.getStatus())
                .createdAt(application.getCreatedAt())
                .evaluatedAt(application.getEvaluatedAt())
                .rejectionReason(application.getRejectionReason())
                .build();
    }
}
