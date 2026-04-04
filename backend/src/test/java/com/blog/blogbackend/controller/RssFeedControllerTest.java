package com.blog.blogbackend.controller;

import com.blog.blogbackend.entity.Post;
import com.blog.blogbackend.entity.PostStatus;
import com.blog.blogbackend.repository.PostRepository;
import com.blog.blogbackend.security.JwtTokenProvider;
import com.blog.blogbackend.security.CustomUserDetailsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RssFeedController.class)
@AutoConfigureMockMvc(addFilters = false)
public class RssFeedControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PostRepository postRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @Test
    void getRssFeed_ShouldReturnXml() throws Exception {
        Post post = Post.builder()
                .title("RSS Post")
                .slug("rss-post")
                .excerpt("Excerpt")
                .status(PostStatus.PUBLISHED)
                .publishedAt(LocalDateTime.now())
                .build();

        when(postRepository.findTop20ByStatusOrderByPublishedAtDesc(PostStatus.PUBLISHED))
                .thenReturn(Collections.singletonList(post));

        mockMvc.perform(get("/api/feed.rss"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/rss+xml; charset=UTF-8"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("<title>RSS Post</title>")));
    }

    @Test
    void getRssFeed_ShouldPreferForwardedHeaders() throws Exception {
        Post post = Post.builder()
                .title("RSS Post")
                .slug("rss-post")
                .excerpt("Excerpt")
                .status(PostStatus.PUBLISHED)
                .publishedAt(LocalDateTime.now())
                .build();

        when(postRepository.findTop20ByStatusOrderByPublishedAtDesc(PostStatus.PUBLISHED))
                .thenReturn(Collections.singletonList(post));

        mockMvc.perform(get("/api/feed.rss")
                        .header("X-Forwarded-Host", "blog.example.com")
                        .header("X-Forwarded-Proto", "https"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("<link>https://blog.example.com</link>")));
    }

    @Test
    void getRssFeed_ShouldDefaultForwardedProtoToHttps() throws Exception {
        Post post = Post.builder()
                .title("RSS Post")
                .slug("rss-post")
                .excerpt("Excerpt")
                .status(PostStatus.PUBLISHED)
                .publishedAt(LocalDateTime.now())
                .build();

        when(postRepository.findTop20ByStatusOrderByPublishedAtDesc(PostStatus.PUBLISHED))
                .thenReturn(Collections.singletonList(post));

        mockMvc.perform(get("/api/feed.rss")
                        .header("X-Forwarded-Host", "blog.example.com"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("<link>https://blog.example.com</link>")));
    }
}
