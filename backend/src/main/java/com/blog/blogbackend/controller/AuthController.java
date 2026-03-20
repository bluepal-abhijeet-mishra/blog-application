package com.blog.blogbackend.controller;

import com.blog.blogbackend.dto.AuthResponse;
import com.blog.blogbackend.dto.ForgotPasswordRequest;
import com.blog.blogbackend.dto.LoginRequest;
import com.blog.blogbackend.dto.MessageResponse;
import com.blog.blogbackend.dto.RegisterRequest;
import com.blog.blogbackend.dto.ResetPasswordRequest;
import com.blog.blogbackend.dto.ResetTokenValidationResponse;
import com.blog.blogbackend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "User authentication and registration endpoints")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Operation(
        summary = "Register a new user",
        description = "Creates a new user account. The first user registered becomes an ADMIN automatically."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "User registered successfully",
            content = @Content(schema = @Schema(implementation = AuthResponse.class))
        ),
        @ApiResponse(
            responseCode = "400", 
            description = "Invalid input or email already exists",
            content = @Content
        )
    })
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @Operation(
        summary = "Authenticate user",
        description = "Authenticates a user with email and password, returns JWT token"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Authentication successful",
            content = @Content(schema = @Schema(implementation = AuthResponse.class))
        ),
        @ApiResponse(
            responseCode = "401", 
            description = "Invalid credentials",
            content = @Content
        ),
        @ApiResponse(
            responseCode = "400", 
            description = "Invalid input format",
            content = @Content
        )
    })
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(
        summary = "Request password reset",
        description = "Initiates password reset flow and sends reset instructions when account exists."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Reset request accepted",
            content = @Content(schema = @Schema(implementation = MessageResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid input format",
            content = @Content
        )
    })
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @Operation(
        summary = "Validate password reset token",
        description = "Checks whether a password reset token is valid and not expired."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Validation status returned",
            content = @Content(schema = @Schema(implementation = ResetTokenValidationResponse.class))
        )
    })
    @GetMapping("/reset-password/validate")
    public ResponseEntity<ResetTokenValidationResponse> validateResetToken(@RequestParam String token) {
        return ResponseEntity.ok(authService.validateResetToken(token));
    }

    @Operation(
        summary = "Reset password",
        description = "Resets account password using a valid one-time reset token."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Password reset successfully",
            content = @Content(schema = @Schema(implementation = MessageResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid token or password",
            content = @Content
        )
    })
    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }
}
