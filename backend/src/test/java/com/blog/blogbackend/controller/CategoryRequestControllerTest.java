package com.blog.blogbackend.controller;

import com.blog.blogbackend.dto.CategoryRequestCreateRequest;
import com.blog.blogbackend.dto.CategoryRequestDto;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.UserRepository;
import com.blog.blogbackend.security.JwtTokenProvider;
import com.blog.blogbackend.service.CategoryRequestService;
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

@WebMvcTest(CategoryRequestController.class)
@AutoConfigureMockMvc(addFilters = false)
public class CategoryRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CategoryRequestService categoryRequestService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "author@test.com", roles = "AUTHOR")
    public void submitCategoryRequest_ShouldReturnDto() throws Exception {
        User user = User.builder().email("author@test.com").build();
        CategoryRequestCreateRequest request = new CategoryRequestCreateRequest();
        request.setName("New Category");

        CategoryRequestDto response = CategoryRequestDto.builder()
                .name("New Category")
                .build();

        when(userRepository.findByEmail("author@test.com")).thenReturn(Optional.of(user));
        when(categoryRequestService.submitRequest(any(User.class), any(CategoryRequestCreateRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/category-requests")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Category"));
    }

    @Test
    @WithMockUser(username = "author@test.com", roles = "AUTHOR")
    public void getMyRequests_ShouldReturnList() throws Exception {
        User user = User.builder().email("author@test.com").build();
        CategoryRequestDto response = CategoryRequestDto.builder().name("Category").build();

        when(userRepository.findByEmail("author@test.com")).thenReturn(Optional.of(user));
        when(categoryRequestService.getMyRequests(any(User.class))).thenReturn(Collections.singletonList(response));

        mockMvc.perform(get("/api/category-requests/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Category"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void approveRequest_ShouldReturnDto() throws Exception {
        UUID requestId = UUID.randomUUID();
        CategoryRequestDto response = CategoryRequestDto.builder().name("Approved").build();

        when(userRepository.findByEmail(any())).thenReturn(Optional.of(new User()));
        when(categoryRequestService.approveRequest(any(), eq(requestId), any())).thenReturn(response);

        mockMvc.perform(put("/api/admin/category-requests/" + requestId + "/approve")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Approved"));
    }
}
