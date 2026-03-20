package com.blog.blogbackend.repository;

import com.blog.blogbackend.entity.Role;
import com.blog.blogbackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);
    Optional<User> findByPasswordResetTokenHash(String passwordResetTokenHash);
    List<User> findByRole(Role role);
}
