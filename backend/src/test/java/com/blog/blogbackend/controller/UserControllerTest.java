package com.blog.blogbackend.controller;

import com.blog.blogbackend.dto.UserProfileRequest;
import com.blog.blogbackend.dto.UserProfileResponse;
import com.blog.blogbackend.security.JwtTokenProvider;
import com.blog.blogbackend.service.UserService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser
    public void getProfile_ShouldReturnProfile() throws Exception {
        UserProfileResponse response = UserProfileResponse.builder()
                .displayName("Test User")
                .email("test@example.com")
                .build();

        when(userService.getCurrentUserProfile()).thenReturn(response);

        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    @WithMockUser
    public void updateProfile_ShouldReturnUpdatedProfile() throws Exception {
        UserProfileRequest request = new UserProfileRequest();
        request.setDisplayName("Updated Name");

        UserProfileResponse response = UserProfileResponse.builder()
                .displayName("Updated Name")
                .build();

        when(userService.updateProfile(any(UserProfileRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/users/profile")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Updated Name"));
    }
}
