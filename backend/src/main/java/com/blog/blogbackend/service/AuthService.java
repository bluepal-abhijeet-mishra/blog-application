package com.blog.blogbackend.service;

import lombok.RequiredArgsConstructor;

import com.blog.blogbackend.dto.AuthResponse;
import com.blog.blogbackend.dto.ForgotPasswordRequest;
import com.blog.blogbackend.dto.LoginRequest;
import com.blog.blogbackend.dto.MessageResponse;
import com.blog.blogbackend.dto.RegisterRequest;
import com.blog.blogbackend.dto.ResetPasswordRequest;
import com.blog.blogbackend.dto.ResetTokenValidationResponse;
import com.blog.blogbackend.entity.Role;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.UserRepository;
import com.blog.blogbackend.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String RESET_LINK_GENERIC_MESSAGE =
            "If an account with that email exists, a reset link has been sent.";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final PasswordResetNotificationService passwordResetNotificationService;

    @Value("${app.base-url:http://localhost:5173}")
    private String appBaseUrl;

    @Value("${app.auth.password-reset.expiry-minutes:30}")
    private long resetTokenExpiryMinutes;

    @Value("${app.auth.password-reset.request-cooldown-seconds:60}")
    private long resetRequestCooldownSeconds;

    private final SecureRandom secureRandom = new SecureRandom();



    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        User user = User.builder()
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .role(Role.READER)
                .build();

        // If it's the first user, make them ADMIN
        if (userRepository.count() == 0) {
            user.setRole(Role.ADMIN);
        }

        User savedUser = userRepository.save(user);
        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());

        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", savedUser.getRole());
        extraClaims.put("userId", savedUser.getId());

        String token = jwtTokenProvider.generateToken(userDetails, extraClaims);

        return AuthResponse.builder()
                .token(token)
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .displayName(savedUser.getDisplayName())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());

        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", user.getRole());
        extraClaims.put("userId", user.getId());

        String token = jwtTokenProvider.generateToken(userDetails, extraClaims);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .displayName(user.getDisplayName())
                .build();
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        Optional<User> optionalUser = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (optionalUser.isEmpty()) {
            return MessageResponse.builder().message(RESET_LINK_GENERIC_MESSAGE).build();
        }

        User user = optionalUser.get();
        LocalDateTime now = LocalDateTime.now();
        if (isResetRequestOnCooldown(user, now)) {
            return MessageResponse.builder().message(RESET_LINK_GENERIC_MESSAGE).build();
        }

        String rawResetToken = generateResetToken();
        user.setPasswordResetTokenHash(hashToken(rawResetToken));
        user.setPasswordResetExpiresAt(now.plusMinutes(resetTokenExpiryMinutes));
        user.setPasswordResetRequestedAt(now);
        userRepository.save(user);

        String resetUrl = buildResetUrl(rawResetToken);
        passwordResetNotificationService.sendPasswordResetEmail(
                user.getEmail(),
                user.getDisplayName(),
                resetUrl,
                resetTokenExpiryMinutes
        );

        return MessageResponse.builder().message(RESET_LINK_GENERIC_MESSAGE).build();
    }

    @Transactional(readOnly = true)
    public ResetTokenValidationResponse validateResetToken(String token) {
        return ResetTokenValidationResponse.builder()
                .valid(getValidUserByResetToken(token).isPresent())
                .build();
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        User user = getValidUserByResetToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        clearPasswordResetState(user);
        userRepository.save(user);

        return MessageResponse.builder()
                .message("Password reset successfully")
                .build();
    }

    private Optional<User> getValidUserByResetToken(String rawToken) {
        String tokenHash = hashToken(rawToken);
        Optional<User> userOptional = userRepository.findByPasswordResetTokenHash(tokenHash);
        if (userOptional.isEmpty()) {
            return Optional.empty();
        }

        User user = userOptional.get();
        if (user.getPasswordResetExpiresAt() == null || user.getPasswordResetExpiresAt().isBefore(LocalDateTime.now())) {
            return Optional.empty();
        }

        return Optional.of(user);
    }

    private String generateResetToken() {
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    private String hashToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return "";
        }

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.trim().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Unable to hash reset token", ex);
        }
    }

    private boolean isResetRequestOnCooldown(User user, LocalDateTime now) {
        if (user.getPasswordResetRequestedAt() == null) {
            return false;
        }
        return user.getPasswordResetRequestedAt().plusSeconds(resetRequestCooldownSeconds).isAfter(now);
    }

    private String buildResetUrl(String rawToken) {
        String normalizedBaseUrl = appBaseUrl.endsWith("/")
                ? appBaseUrl.substring(0, appBaseUrl.length() - 1)
                : appBaseUrl;
        String encodedToken = URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
        return normalizedBaseUrl + "/reset-password?token=" + encodedToken;
    }

    private void clearPasswordResetState(User user) {
        user.setPasswordResetTokenHash(null);
        user.setPasswordResetExpiresAt(null);
        user.setPasswordResetRequestedAt(null);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
