package com.blog.blogbackend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.web.server.ResponseStatusException;
import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final String ERROR_KEY = "error";
    private static final String STATUS_KEY = "status";

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of(
            ERROR_KEY, ex.getReason() != null ? ex.getReason() : "An error occurred",
            STATUS_KEY, ex.getStatusCode().value()
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        return ResponseEntity.badRequest().body(Map.of(
            ERROR_KEY, "Validation failed",
            STATUS_KEY, 400,
            "details", errors
        ));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolationException(ConstraintViolationException ex) {
        Map<String, String> errors = ex.getConstraintViolations().stream()
            .collect(Collectors.toMap(
                violation -> violation.getPropertyPath().toString(),
                ConstraintViolation::getMessage
            ));
        
        return ResponseEntity.badRequest().body(Map.of(
            ERROR_KEY, "Validation failed",
            STATUS_KEY, 400,
            "details", errors
        ));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage();
        
        // Bad Request (400) errors
        if ("Email already exists".equals(message) || 
            "Cannot reply to a reply".equals(message) ||
            "Cannot comment on unpublished post".equals(message) ||
            "Parent comment does not belong to this post".equals(message)) {
            return ResponseEntity.badRequest().body(Map.of(
                ERROR_KEY, message,
                STATUS_KEY, 400
            ));
        }
        
        // Forbidden (403) errors
        if ("Unauthorized".equals(message)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                ERROR_KEY, message,
                STATUS_KEY, 403
            ));
        }
        
        // Not Found (404) errors
        if ("Post not found".equals(message) || 
            "User not found".equals(message) ||
            "Comment not found".equals(message) ||
            "Parent comment not found".equals(message) ||
            "Notification not found".equals(message)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                ERROR_KEY, message,
                STATUS_KEY, 404
            ));
        }
        
        // Default to 500 for other runtime exceptions
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            ERROR_KEY, "Internal server error",
            STATUS_KEY, 500
        ));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
            ERROR_KEY, "Resource not found",
            STATUS_KEY, 404
        ));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
            ERROR_KEY, "Authentication failed",
            STATUS_KEY, 401
        ));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
            ERROR_KEY, "Invalid credentials",
            STATUS_KEY, 401
        ));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
            ERROR_KEY, "Access denied",
            STATUS_KEY, 403
        ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of(
            ERROR_KEY, ex.getMessage(),
            STATUS_KEY, 400
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        // Log the exception for debugging
        ex.printStackTrace();
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            ERROR_KEY, "An unexpected error occurred",
            STATUS_KEY, 500
        ));
    }
}
