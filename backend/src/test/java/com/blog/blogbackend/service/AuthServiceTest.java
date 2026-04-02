package com.blog.blogbackend.service;

import com.blog.blogbackend.dto.*;
import com.blog.blogbackend.entity.Role;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.UserRepository;
import com.blog.blogbackend.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private PasswordResetNotificationService passwordResetNotificationService;

    @InjectMocks
    private AuthService authService;

    @Test
    void registerShouldCreateUserAndReturnToken() {
        RegisterRequest request = new RegisterRequest("test@example.com", "password", "Test User");
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .displayName("Test User")
                .role(Role.READER)
                .build();

        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userDetailsService.loadUserByUsername(anyString())).thenReturn(mock(UserDetails.class));
        when(jwtTokenProvider.generateToken(any(), any())).thenReturn("mockToken");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mockToken", response.getToken());
        assertEquals("test@example.com", response.getEmail());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerShouldMakeFirstUserAdmin() {
        RegisterRequest request = new RegisterRequest("admin@example.com", "password", "Admin User");
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("admin@example.com")
                .displayName("Admin User")
                .role(Role.ADMIN)
                .build();

        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(userRepository.count()).thenReturn(0L);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userDetailsService.loadUserByUsername(anyString())).thenReturn(mock(UserDetails.class));
        when(jwtTokenProvider.generateToken(any(), any())).thenReturn("mockToken");

        AuthResponse response = authService.register(request);

        assertEquals(Role.ADMIN, response.getRole());
    }

    @Test
    void registerShouldThrowIfEmailExists() {
        RegisterRequest request = new RegisterRequest("existing@example.com", "password", "Existing User");
        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> authService.register(request));
        assertEquals("Email already exists", exception.getMessage());
    }

    @Test
    void loginShouldReturnTokenOnSuccess() {
        LoginRequest request = new LoginRequest("test@example.com", "password");
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .displayName("Test User")
                .role(Role.READER)
                .build();

        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));
        when(userDetailsService.loadUserByUsername(anyString())).thenReturn(mock(UserDetails.class));
        when(jwtTokenProvider.generateToken(any(), any())).thenReturn("mockToken");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mockToken", response.getToken());
        verify(authenticationManager).authenticate(any());
    }

    @Test
    void loginShouldThrowIfUserNotFound() {
        LoginRequest request = new LoginRequest("nonexistent@example.com", "password");
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> authService.login(request));
        assertEquals("User not found", exception.getMessage());
    }

    @Test
    void forgotPasswordShouldReturnSuccessEvenIfUserNotFound() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("unknown@example.com");
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());

        MessageResponse response = authService.forgotPassword(request);

        assertTrue(response.getMessage().contains("If an account with that email exists"));
        verify(passwordResetNotificationService, never()).sendPasswordResetEmail(any(), any(), any(), anyLong());
    }

    @Test
    void forgotPasswordShouldSendEmailWhenUserFound() {
        ReflectionTestUtils.setField(authService, "appBaseUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(authService, "resetTokenExpiryMinutes", 30L);
        
        ForgotPasswordRequest request = new ForgotPasswordRequest("user@example.com");
        User user = User.builder()
                .email("user@example.com")
                .displayName("Jane")
                .build();
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));

        MessageResponse response = authService.forgotPassword(request);

        assertTrue(response.getMessage().contains("If an account with that email exists"));
        verify(userRepository).save(user);
        verify(passwordResetNotificationService).sendPasswordResetEmail(eq("user@example.com"), eq("Jane"), anyString(), eq(30L));
        assertNotNull(user.getPasswordResetTokenHash());
    }

    @Test
    void forgotPasswordShouldReturnSuccessIfOnCooldown() {
        ReflectionTestUtils.setField(authService, "resetRequestCooldownSeconds", 60L);
        ForgotPasswordRequest request = new ForgotPasswordRequest("user@example.com");
        User user = User.builder()
                .email("user@example.com")
                .passwordResetRequestedAt(LocalDateTime.now().minusSeconds(30))
                .build();
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));

        MessageResponse response = authService.forgotPassword(request);

        assertTrue(response.getMessage().contains("If an account with that email exists"));
        verify(passwordResetNotificationService, never()).sendPasswordResetEmail(any(), any(), any(), anyLong());
    }

    @Test
    void validateResetTokenShouldReturnTrueForValidToken() {
        String token = "valid_token";
        User user = User.builder()
                .passwordResetExpiresAt(LocalDateTime.now().plusHours(1))
                .build();
        when(userRepository.findByPasswordResetTokenHash(anyString())).thenReturn(Optional.of(user));

        ResetTokenValidationResponse response = authService.validateResetToken(token);

        assertTrue(response.isValid());
    }

    @Test
    void validateResetTokenShouldReturnFalseForExpiredToken() {
        String token = "expired_token";
        User user = User.builder()
                .passwordResetExpiresAt(LocalDateTime.now().minusHours(1))
                .build();
        when(userRepository.findByPasswordResetTokenHash(anyString())).thenReturn(Optional.of(user));

        ResetTokenValidationResponse response = authService.validateResetToken(token);

        assertFalse(response.isValid());
    }

    @Test
    void resetPasswordShouldWorkForValidToken() {
        ResetPasswordRequest request = new ResetPasswordRequest("token", "newPassword");
        User user = User.builder()
                .password("oldEncodedPassword")
                .passwordResetExpiresAt(LocalDateTime.now().plusHours(1))
                .build();
        when(userRepository.findByPasswordResetTokenHash(anyString())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("newEncodedPassword");

        MessageResponse response = authService.resetPassword(request);

        assertEquals("Password reset successfully", response.getMessage());
        assertEquals("newEncodedPassword", user.getPassword());
        assertNull(user.getPasswordResetTokenHash());
    }

    @Test
    void resetPasswordShouldThrowIfTokenInvalid() {
        ResetPasswordRequest request = new ResetPasswordRequest("invalid", "newPass");
        when(userRepository.findByPasswordResetTokenHash(anyString())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> authService.resetPassword(request));
    }

    @Test
    void resetPasswordShouldThrowIfNewPasswordMatchesOld() {
        ResetPasswordRequest request = new ResetPasswordRequest("token", "oldPassword");
        User user = User.builder()
                .password("oldEncodedPassword")
                .passwordResetExpiresAt(LocalDateTime.now().plusHours(1))
                .build();
        when(userRepository.findByPasswordResetTokenHash(anyString())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> authService.resetPassword(request));
    }
}
