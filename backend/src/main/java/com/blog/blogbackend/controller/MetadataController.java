package com.blog.blogbackend.controller;

import com.blog.blogbackend.dto.CategoryDto;
import com.blog.blogbackend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
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

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDto>> getCategories() {
        return ResponseEntity.ok(categoryRepository.findAll().stream()
                .map(c -> CategoryDto.builder().id(c.getId()).name(c.getName()).slug(c.getSlug()).build())
                .collect(Collectors.toList()));
    }
}
