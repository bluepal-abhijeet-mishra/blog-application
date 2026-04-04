package com.blog.blogbackend.controller;

import com.blog.blogbackend.dto.CommentRequest;
import com.blog.blogbackend.dto.CommentResponse;
import com.blog.blogbackend.security.JwtTokenProvider;
import com.blog.blogbackend.service.CommentService;
import com.blog.blogbackend.security.CustomUserDetailsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CommentController.class)
@AutoConfigureMockMvc(addFilters = false)
public class CommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CommentService commentService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void getComments_ShouldReturnPageOfComments() throws Exception {
        UUID postId = UUID.randomUUID();
        CommentResponse comment = CommentResponse.builder()
                .id(UUID.randomUUID())
                .content("Test Comment")
                .authorName("User")
                .build();

        Page<CommentResponse> page = new PageImpl<>(Collections.singletonList(comment));

        when(commentService.getCommentsForPost(eq(postId), any())).thenReturn(page);

        mockMvc.perform(get("/api/posts/" + postId + "/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].content").value("Test Comment"));
    }

    @Test
    @WithMockUser
    public void addComment_ShouldReturnCreatedComment() throws Exception {
        UUID postId = UUID.randomUUID();
        CommentRequest request = new CommentRequest();
        request.setContent("New Comment");

        CommentResponse response = CommentResponse.builder()
                .id(UUID.randomUUID())
                .content("New Comment")
                .build();

        when(commentService.addComment(eq(postId), any(CommentRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/posts/" + postId + "/comments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("New Comment"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void deleteComment_ShouldReturnOk() throws Exception {
        UUID commentId = UUID.randomUUID();

        mockMvc.perform(delete("/api/comments/" + commentId)
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }
}
