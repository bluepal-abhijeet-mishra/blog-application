package com.blog.blogbackend.controller;

import com.blog.blogbackend.dto.CategoryDto;
import com.blog.blogbackend.dto.PostRequest;
import com.blog.blogbackend.dto.PostResponse;
import com.blog.blogbackend.entity.PostStatus;
import com.blog.blogbackend.security.JwtTokenProvider;
import com.blog.blogbackend.service.PostService;
import com.blog.blogbackend.security.CustomUserDetailsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

@WebMvcTest(PostController.class)
@AutoConfigureMockMvc(addFilters = false)
public class PostControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PostService postService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void getAllPosts_ShouldReturnPageOfPosts() throws Exception {
        PostResponse postResponse = PostResponse.builder()
                .id(UUID.randomUUID())
                .title("Test Post")
                .slug("test-post")
                .status(PostStatus.PUBLISHED)
                .build();

        Page<PostResponse> page = new PageImpl<>(Collections.singletonList(postResponse));

        when(postService.getPublishedPosts(any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/posts")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Test Post"));
    }

    @Test
    public void getPostBySlug_ShouldReturnPost() throws Exception {
        PostResponse postResponse = PostResponse.builder()
                .id(UUID.randomUUID())
                .title("Test Post")
                .slug("test-post")
                .status(PostStatus.PUBLISHED)
                .build();

        when(postService.getPostBySlug("test-post")).thenReturn(postResponse);

        mockMvc.perform(get("/api/posts/test-post"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test Post"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void createPost_ShouldReturnCreatedPost() throws Exception {
        PostRequest request = PostRequest.builder()
                .title("New Post")
                .content("Content")
                .build();

        PostResponse response = PostResponse.builder()
                .id(UUID.randomUUID())
                .title("New Post")
                .slug("new-post")
                .build();

        when(postService.createPost(any(PostRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/posts")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("New Post"));
    }

    @Test
    @WithMockUser
    public void exportJson_ShouldReturnByteArray() throws Exception {
        byte[] data = "{\"posts\":[]}".getBytes();
        when(postService.exportAllPostsJson()).thenReturn(data);

        mockMvc.perform(get("/api/posts/export/json"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_JSON_VALUE))
                .andExpect(header().string("Content-Disposition", "attachment; filename=my-posts.json"))
                .andExpect(content().bytes(data));
    }

    @Test
    @WithMockUser
    public void exportCsv_ShouldReturnByteArray() throws Exception {
        byte[] data = "Title,Views\nTest,0".getBytes();
        when(postService.generateEngagementCsv()).thenReturn(data);

        mockMvc.perform(get("/api/posts/analytics/export/csv"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/csv"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=engagement-stats.csv"))
                .andExpect(content().bytes(data));
    }

    @Test
    @WithMockUser(roles = "AUTHOR")
    public void deletePost_ShouldReturnNoContent() throws Exception {
        UUID postId = UUID.randomUUID();

        mockMvc.perform(delete("/api/posts/" + postId)
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }
}
