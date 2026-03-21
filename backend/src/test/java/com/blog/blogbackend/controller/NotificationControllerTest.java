package com.blog.blogbackend.controller;

import com.blog.blogbackend.dto.NotificationDto;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.UserRepository;
import com.blog.blogbackend.security.JwtTokenProvider;
import com.blog.blogbackend.service.NotificationService;
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

import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
public class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "test@example.com")
    public void getNotifications_ShouldReturnList() throws Exception {
        User user = User.builder().email("test@example.com").build();
        NotificationDto dto = NotificationDto.builder()
                .message("Test Notification")
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(notificationService.getNotifications(any(User.class), anyInt())).thenReturn(Collections.singletonList(dto));

        mockMvc.perform(get("/api/notifications")
                        .param("limit", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].message").value("Test Notification"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void getUnreadCount_ShouldReturnCount() throws Exception {
        User user = User.builder().email("test@example.com").build();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(notificationService.getUnreadCount(any(User.class))).thenReturn(Map.of("unreadCount", 5L));

        mockMvc.perform(get("/api/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(5));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void markAsRead_ShouldReturnDto() throws Exception {
        User user = User.builder().email("test@example.com").build();
        UUID notificationId = UUID.randomUUID();
        NotificationDto dto = NotificationDto.builder().id(notificationId).isRead(true).build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(notificationService.markAsRead(any(User.class), any())).thenReturn(dto);

        mockMvc.perform(patch("/api/notifications/" + notificationId + "/read")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRead").value(true));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void markAllAsRead_ShouldReturnNoContent() throws Exception {
        User user = User.builder().email("test@example.com").build();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        mockMvc.perform(patch("/api/notifications/read-all")
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }
}
