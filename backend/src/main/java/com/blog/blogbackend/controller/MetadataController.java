package com.blog.blogbackend.controller;

import com.blog.blogbackend.dto.CategoryDto;
import com.blog.blogbackend.dto.TagDto;
import com.blog.blogbackend.repository.CategoryRepository;
import com.blog.blogbackend.repository.TagRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class MetadataController {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TagRepository tagRepository;

    @GetMapping("/categories")
    @Cacheable("categories")
    public ResponseEntity<List<CategoryDto>> getCategories() {
        return ResponseEntity.ok(categoryRepository.findAll().stream()
                .map(c -> CategoryDto.builder().id(c.getId()).name(c.getName()).slug(c.getSlug()).build())
                .collect(Collectors.toList()));
    }

    @GetMapping("/tags")
    @Cacheable("tags")
    public ResponseEntity<List<TagDto>> getTags() {
        return ResponseEntity.ok(tagRepository.findAll().stream()
                .map(t -> TagDto.builder().id(t.getId()).name(t.getName()).slug(t.getSlug()).build())
                .collect(Collectors.toList()));
    }
}
