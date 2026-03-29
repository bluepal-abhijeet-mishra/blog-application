package com.blog.blogbackend.controller;

import com.blog.blogbackend.entity.Role;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.CommentRepository;
import com.blog.blogbackend.repository.PostRepository;
import com.blog.blogbackend.repository.UserRepository;
import com.blog.blogbackend.security.JwtTokenProvider;
import com.blog.blogbackend.security.CustomUserDetailsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PostRepository postRepository;

    @MockBean
    private CommentRepository commentRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(roles = "ADMIN")
    public void getAllUsers_ShouldReturnUserList() throws Exception {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("admin@test.com")
                .displayName("Admin User")
                .role(Role.ADMIN)
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findAll()).thenReturn(Collections.singletonList(user));

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("admin@test.com"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void updateUserRole_ShouldReturnNoContent() throws Exception {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).role(Role.READER).build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        Map<String, String> request = new HashMap<>();
        request.put("role", "AUTHOR");

        mockMvc.perform(patch("/api/admin/users/" + userId + "/role")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void getPlatformStats_ShouldReturnStats() throws Exception {
        when(userRepository.findAll()).thenReturn(Collections.emptyList());
        when(postRepository.findAll()).thenReturn(Collections.emptyList());
        when(commentRepository.count()).thenReturn(0L);

        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(0))
                .andExpect(jsonPath("$.userGrowth").isArray());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void forceDeleteComment_ShouldReturnNoContent() throws Exception {
        UUID commentId = UUID.randomUUID();
        when(commentRepository.existsById(commentId)).thenReturn(true);

        mockMvc.perform(delete("/api/admin/comments/" + commentId)
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void updateUserRole_ToAdmin_ShouldReturnBadRequest() throws Exception {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).role(Role.AUTHOR).build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        Map<String, String> request = new HashMap<>();
        request.put("role", "ADMIN");

        mockMvc.perform(patch("/api/admin/users/" + userId + "/role")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
