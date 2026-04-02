package com.blog.blogbackend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.*;
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

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage sent = captor.getValue();
        assertEquals("Reset your BlogSpace password", sent.getSubject());
        assertNotNull(sent.getText());
        assertTrue(sent.getText().contains("John"));
        assertTrue(sent.getText().contains("http://reset-link"));
    }

    @Test
    void sendPasswordResetEmailShouldNotThrowWhenMailSenderNull() {
        PasswordResetNotificationService service =
                new PasswordResetNotificationService(null, "no-reply@blogspace.local");

        assertDoesNotThrow(() ->
                service.sendPasswordResetEmail("user@test.com", "John", "http://reset-link", 30));
    }

    @Test
    void sendPasswordResetEmailShouldHandleMailException() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        doThrow(new RuntimeException("SMTP error")).when(mailSender).send(any(SimpleMailMessage.class));
        PasswordResetNotificationService service =
                new PasswordResetNotificationService(mailSender, "no-reply@blogspace.local");

        assertDoesNotThrow(() ->
                service.sendPasswordResetEmail("user@test.com", "John", "http://reset-link", 30));
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "   "})
    void sendPasswordResetEmailShouldFallbackDisplayName(String displayName) {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        PasswordResetNotificationService service =
                new PasswordResetNotificationService(mailSender, "no-reply@blogspace.local");

        service.sendPasswordResetEmail("user@test.com", displayName, "http://reset-link", 60);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        assertTrue(captor.getValue().getText().contains("Hi there"));
    }
}
