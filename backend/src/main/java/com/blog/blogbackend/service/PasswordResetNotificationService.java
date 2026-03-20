package com.blog.blogbackend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetNotificationService.class);

    private final JavaMailSender mailSender;
    private final String mailFrom;

    public PasswordResetNotificationService(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${app.mail.from:no-reply@blogspace.local}") String mailFrom) {
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
    }

    public void sendPasswordResetEmail(String toEmail, String displayName, String resetUrl, long expiresInMinutes) {
        if (mailSender == null) {
            logger.warn("SMTP not configured. Password reset link for {}: {}", toEmail, resetUrl);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(toEmail);
        message.setSubject("Reset your BlogSpace password");
        message.setText(buildMessageBody(displayName, resetUrl, expiresInMinutes));

        try {
            mailSender.send(message);
            logger.info("Password reset email sent to {}", toEmail);
        } catch (Exception ex) {
            logger.error("Failed to send password reset email to {}. Reset link: {}", toEmail, resetUrl, ex);
        }
    }

    private String buildMessageBody(String displayName, String resetUrl, long expiresInMinutes) {
        String safeDisplayName = (displayName == null || displayName.isBlank()) ? "there" : displayName;
        return "Hi " + safeDisplayName + ",\n\n"
                + "We received a request to reset your BlogSpace password.\n\n"
                + "Use this secure link to set a new password:\n"
                + resetUrl + "\n\n"
                + "This link expires in " + expiresInMinutes + " minutes and can be used once.\n"
                + "If you did not request this, you can ignore this email.\n\n"
                + "BlogSpace Security Team";
    }
}
