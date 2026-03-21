package com.blog.blogbackend.controller;

import com.blog.blogbackend.dto.AuthorApplicationDto;
import com.blog.blogbackend.entity.AuthorApplicationStatus;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.UserRepository;
import com.blog.blogbackend.security.JwtTokenProvider;
import com.blog.blogbackend.service.AuthorApplicationService;
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
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthorApplicationController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AuthorApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthorApplicationService applicationService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "reader@test.com", roles = "READER")
    public void submitApplication_ShouldReturnOk() throws Exception {
        User user = User.builder().email("reader@test.com").build();
        AuthorApplicationDto dto = new AuthorApplicationDto();
        dto.setBio("Test Bio");

        when(userRepository.findByEmail("reader@test.com")).thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/applications")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string("Application submitted successfully."));
    }

    @Test
    @WithMockUser(username = "reader@test.com", roles = "READER")
    public void getMyApplications_ShouldReturnList() throws Exception {
        User user = User.builder().email("reader@test.com").build();
        AuthorApplicationDto dto = new AuthorApplicationDto();
        dto.setBio("Test Bio");

        when(userRepository.findByEmail("reader@test.com")).thenReturn(Optional.of(user));
        when(applicationService.getMyApplications(any(User.class))).thenReturn(Collections.singletonList(dto));

        mockMvc.perform(get("/api/applications/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].bio").value("Test Bio"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void approveApplication_ShouldReturnOk() throws Exception {
        UUID appId = UUID.randomUUID();

        mockMvc.perform(put("/api/applications/" + appId + "/approve")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().string("Application approved. User is now an AUTHOR."));
    }
}
