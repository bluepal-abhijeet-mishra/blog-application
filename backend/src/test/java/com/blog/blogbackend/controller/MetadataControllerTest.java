package com.blog.blogbackend.controller;

import com.blog.blogbackend.entity.Category;
import com.blog.blogbackend.entity.Tag;
import com.blog.blogbackend.repository.CategoryRepository;
import com.blog.blogbackend.repository.TagRepository;
import com.blog.blogbackend.security.JwtTokenProvider;
import com.blog.blogbackend.security.CustomUserDetailsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MetadataController.class)
@AutoConfigureMockMvc(addFilters = false)
public class MetadataControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CategoryRepository categoryRepository;

    @MockBean
    private TagRepository tagRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @Test
    public void getCategories_ShouldReturnList() throws Exception {
        Category category = Category.builder()
                .id(UUID.randomUUID())
                .name("Tech")
                .slug("tech")
                .build();

        when(categoryRepository.findAll()).thenReturn(Collections.singletonList(category));

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Tech"));
    }

    @Test
    public void getTags_ShouldReturnList() throws Exception {
        Tag tag = Tag.builder()
                .id(UUID.randomUUID())
                .name("Java")
                .slug("java")
                .build();

        when(tagRepository.findAll()).thenReturn(Collections.singletonList(tag));

        mockMvc.perform(get("/api/tags"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Java"));
    }
}
