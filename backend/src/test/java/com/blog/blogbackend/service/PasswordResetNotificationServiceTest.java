package com.blog.blogbackend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetNotificationServiceTest {

    @Test
    void sendPasswordResetEmailShouldSendWhenMailSenderAvailable() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        PasswordResetNotificationService service =
                new PasswordResetNotificationService(mailSender, "no-reply@blogspace.local");

        service.sendPasswordResetEmail("user@test.com", "John", "http://reset-link", 30);

        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendPasswordResetEmailShouldSkipWhenMailSenderNull() {
        PasswordResetNotificationService service =
                new PasswordResetNotificationService(null, "no-reply@blogspace.local");

        service.sendPasswordResetEmail("user@test.com", "John", "http://reset-link", 30);

        // No exception thrown, method completes gracefully
    }

    @Test
    void sendPasswordResetEmailShouldHandleMailException() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        doThrow(new RuntimeException("SMTP error")).when(mailSender).send(any(SimpleMailMessage.class));
        PasswordResetNotificationService service =
                new PasswordResetNotificationService(mailSender, "no-reply@blogspace.local");

        // Should not throw - exception is caught and logged
        service.sendPasswordResetEmail("user@test.com", "John", "http://reset-link", 30);

        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendPasswordResetEmailShouldHandleNullDisplayName() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        PasswordResetNotificationService service =
                new PasswordResetNotificationService(mailSender, "no-reply@blogspace.local");

        service.sendPasswordResetEmail("user@test.com", null, "http://reset-link", 30);

        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendPasswordResetEmailShouldHandleBlankDisplayName() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        PasswordResetNotificationService service =
                new PasswordResetNotificationService(mailSender, "no-reply@blogspace.local");

        service.sendPasswordResetEmail("user@test.com", "   ", "http://reset-link", 60);

        verify(mailSender).send(any(SimpleMailMessage.class));
    }
}
