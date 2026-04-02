package com.blog.blogbackend.service;

import com.blog.blogbackend.dto.AuthorApplicationDto;
import com.blog.blogbackend.entity.AuthorApplication;
import com.blog.blogbackend.entity.AuthorApplicationStatus;
import com.blog.blogbackend.entity.NotificationType;
import com.blog.blogbackend.entity.Role;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.AuthorApplicationRepository;
import com.blog.blogbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthorApplicationServiceTest {

    @Mock
    private AuthorApplicationRepository applicationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private AuthorApplicationService applicationService;

    private User user;
    private AuthorApplicationDto applicationDto;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(UUID.randomUUID());
        user.setDisplayName("Jane Doe");
        user.setEmail("jane.doe@example.com");
        user.setRole(Role.READER);

        applicationDto = AuthorApplicationDto.builder()
                .bio("I love writing about technology.")
                .build();
    }

    @Test
    void submitApplication_Success() {
        when(applicationRepository.existsByUserIdAndStatus(user.getId(), AuthorApplicationStatus.PENDING)).thenReturn(false);

        applicationService.submitApplication(user, applicationDto);

        verify(applicationRepository, times(1)).save(any(AuthorApplication.class));
        verify(notificationService).createNotificationForAdmins(eq(NotificationType.AUTHOR_APPLICATION_SUBMITTED), anyString(), anyString(), anyString());
    }

    @Test
    void submitApplication_AlreadyPending() {
        when(applicationRepository.existsByUserIdAndStatus(user.getId(), AuthorApplicationStatus.PENDING)).thenReturn(true);

        assertThrows(RuntimeException.class, () -> applicationService.submitApplication(user, applicationDto));
        verify(applicationRepository, never()).save(any(AuthorApplication.class));
    }

    @Test
    void approveApplication_Success() {
        UUID appId = UUID.randomUUID();
        AuthorApplication application = AuthorApplication.builder()
                .id(appId)
                .user(user)
                .status(AuthorApplicationStatus.PENDING)
                .build();

        when(applicationRepository.findById(appId)).thenReturn(Optional.of(application));

        applicationService.approveApplication(appId);

        assertEquals(AuthorApplicationStatus.APPROVED, application.getStatus());
        assertEquals(Role.AUTHOR, user.getRole());
        verify(userRepository).save(user);
        verify(applicationRepository).save(application);
        verify(notificationService).createNotification(eq(user), eq(NotificationType.AUTHOR_APPLICATION_APPROVED), anyString(), anyString(), anyString());
    }

    @Test
    void rejectApplication_Success() {
        UUID appId = UUID.randomUUID();
        AuthorApplication application = AuthorApplication.builder()
                .id(appId)
                .user(user)
                .status(AuthorApplicationStatus.PENDING)
                .build();

        when(applicationRepository.findById(appId)).thenReturn(Optional.of(application));

        applicationService.rejectApplication(appId, "Insufficient experience");

        assertEquals(AuthorApplicationStatus.REJECTED, application.getStatus());
        assertEquals("Insufficient experience", application.getRejectionReason());
        verify(applicationRepository).save(application);
        verify(notificationService).createNotification(eq(user), eq(NotificationType.AUTHOR_APPLICATION_REJECTED), anyString(), anyString(), anyString());
    }

    @Test
    void approveApplication_NotFound() {
        UUID appId = UUID.randomUUID();
        when(applicationRepository.findById(appId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> applicationService.approveApplication(appId));
    }

    @Test
    void rejectApplication_NotFound() {
        UUID appId = UUID.randomUUID();
        when(applicationRepository.findById(appId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> applicationService.rejectApplication(appId, "reason"));
    }

    @Test
    void getAllApplications_WithStatus() {
        when(applicationRepository.findByStatus(AuthorApplicationStatus.PENDING)).thenReturn(Collections.emptyList());

        List<AuthorApplicationDto> result = applicationService.getAllApplications(AuthorApplicationStatus.PENDING);
        assertTrue(result.isEmpty());
    }

    @Test
    void getAllApplications_WithoutStatus() {
        when(applicationRepository.findAll()).thenReturn(Collections.emptyList());

        List<AuthorApplicationDto> result = applicationService.getAllApplications(null);
        assertTrue(result.isEmpty());
    }

    @Test
    void getMyApplications_Success() {
        when(applicationRepository.findByUserId(user.getId())).thenReturn(Collections.emptyList());

        List<AuthorApplicationDto> result = applicationService.getMyApplications(user);
        assertTrue(result.isEmpty());
    }
}
