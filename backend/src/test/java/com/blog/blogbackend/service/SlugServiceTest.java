package com.blog.blogbackend.service;

import com.blog.blogbackend.repository.PostRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SlugServiceTest {

    @Mock
    private PostRepository postRepository;

    @InjectMocks
    private SlugService slugService;

    @Test
    void slugifyShouldConvertToLowercaseAndHyphenate() {
        String input = "Hello World Test";
        String expected = "hello-world-test";
        String result = slugService.slugify(input);
        assertEquals(expected, result);
    }

    @Test
    void slugifyShouldHandleSpecialCharacters() {
        String input = "Hello @ World! #2024";
        String expected = "hello--world-2024";
        String result = slugService.slugify(input);
        assertEquals(expected, result);
    }

    @Test
    void generateSlugShouldReturnUniqueSlug() {
        String input = "Testing Slug Generation";
        String baseSlug = "testing-slug-generation";
        
        when(postRepository.existsBySlug(baseSlug)).thenReturn(false);
        
        String result = slugService.generateSlug(input);
        
        assertEquals(baseSlug, result);
    }

    @Test
    void generateSlugShouldAppendNumberIfDuplicate() {
        String input = "Duplicate Title";
        String baseSlug = "duplicate-title";
        
        when(postRepository.existsBySlug(baseSlug)).thenReturn(true);
        when(postRepository.existsBySlug(baseSlug + "-2")).thenReturn(false);
        
        String result = slugService.generateSlug(input);
        
        assertEquals(baseSlug + "-2", result);
    }

    @Test
    void generateSlugShouldIncrementCounterForMultipleDuplicates() {
        String input = "Duplicate Title";
        String baseSlug = "duplicate-title";
        
        when(postRepository.existsBySlug(baseSlug)).thenReturn(true);
        when(postRepository.existsBySlug(baseSlug + "-2")).thenReturn(true);
        when(postRepository.existsBySlug(baseSlug + "-3")).thenReturn(false);
        
        String result = slugService.generateSlug(input);
        
        assertEquals(baseSlug + "-3", result);
    }
}
