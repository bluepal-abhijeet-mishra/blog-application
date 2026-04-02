package com.blog.blogbackend.service;

import com.blog.blogbackend.dto.CategoryRequestCreateRequest;
import com.blog.blogbackend.dto.CategoryRequestDecisionRequest;
import com.blog.blogbackend.dto.CategoryRequestDto;
import com.blog.blogbackend.entity.Category;
import com.blog.blogbackend.entity.CategoryRequest;
import com.blog.blogbackend.entity.CategoryRequestStatus;
import com.blog.blogbackend.entity.NotificationType;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.CategoryRepository;
import com.blog.blogbackend.repository.CategoryRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryRequestServiceTest {

    @Mock
    private CategoryRequestRepository categoryRequestRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SlugService slugService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private CategoryRequestService categoryRequestService;

    private User user;
    private CategoryRequestCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(UUID.randomUUID());
        user.setDisplayName("John Doe");
        user.setEmail("john.doe@example.com");

        createRequest = new CategoryRequestCreateRequest();
        createRequest.setName("Tech Category");
        createRequest.setReason("Testing purpose");
    }

    @Test
    void submitRequest_Success() {
        String slug = "tech-category";
        when(slugService.slugify(anyString())).thenReturn(slug);
        when(categoryRepository.findBySlug(slug)).thenReturn(Optional.empty());
        when(categoryRequestRepository.existsBySlugAndStatusIn(eq(slug), any(Set.class))).thenReturn(false);
        
        CategoryRequest saved = CategoryRequest.builder()
                .id(UUID.randomUUID())
                .name("Tech Category")
                .slug(slug)
                .requestedBy(user)
                .status(CategoryRequestStatus.PENDING)
                .build();
        when(categoryRequestRepository.save(any(CategoryRequest.class))).thenReturn(saved);

        CategoryRequestDto result = categoryRequestService.submitRequest(user, createRequest);

        assertNotNull(result);
        assertEquals(slug, result.getSlug());
        verify(notificationService).createNotificationForAdmins(eq(NotificationType.CATEGORY_REQUEST_SUBMITTED), anyString(), anyString(), anyString());
    }

    @Test
    void submitRequest_InvalidName() {
        createRequest.setName("");
        assertThrows(RuntimeException.class, () -> categoryRequestService.submitRequest(user, createRequest));
    }

    @Test
    void submitRequest_CategoryExists() {
        String slug = "tech-category";
        when(slugService.slugify(anyString())).thenReturn(slug);
        when(categoryRepository.findBySlug(slug)).thenReturn(Optional.of(new Category()));

        assertThrows(RuntimeException.class, () -> categoryRequestService.submitRequest(user, createRequest));
    }

    @Test
    void getMyRequests_Success() {
        when(categoryRequestRepository.findByRequestedByIdOrderByCreatedAtDesc(user.getId()))
                .thenReturn(Collections.emptyList());

        List<CategoryRequestDto> result = categoryRequestService.getMyRequests(user);
        assertTrue(result.isEmpty());
    }

    @Test
    void approveRequest_Success() {
        UUID requestId = UUID.randomUUID();
        CategoryRequest request = CategoryRequest.builder()
                .id(requestId)
                .name("Tech")
                .slug("tech")
                .requestedBy(user)
                .status(CategoryRequestStatus.PENDING)
                .build();

        when(categoryRequestRepository.findById(requestId)).thenReturn(Optional.of(request));
        when(categoryRepository.findBySlug("tech")).thenReturn(Optional.empty());
        when(categoryRequestRepository.save(any(CategoryRequest.class))).thenReturn(request);

        CategoryRequestDto result = categoryRequestService.approveRequest(user, requestId, new CategoryRequestDecisionRequest());

        assertEquals(CategoryRequestStatus.APPROVED, result.getStatus());
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void rejectRequest_Success() {
        UUID requestId = UUID.randomUUID();
        CategoryRequest request = CategoryRequest.builder()
                .id(requestId)
                .name("Tech")
                .slug("tech")
                .requestedBy(user)
                .status(CategoryRequestStatus.PENDING)
                .build();

        when(categoryRequestRepository.findById(requestId)).thenReturn(Optional.of(request));
        when(categoryRequestRepository.save(any(CategoryRequest.class))).thenReturn(request);

        CategoryRequestDto result = categoryRequestService.rejectRequest(user, requestId, new CategoryRequestDecisionRequest());

        assertEquals(CategoryRequestStatus.REJECTED, result.getStatus());
    }

    @Test
    void approveRequest_NotFound() {
        UUID requestId = UUID.randomUUID();
        when(categoryRequestRepository.findById(requestId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> categoryRequestService.approveRequest(user, requestId, new CategoryRequestDecisionRequest()));
    }

    @Test
    void rejectRequest_NotFound() {
        UUID requestId = UUID.randomUUID();
        when(categoryRequestRepository.findById(requestId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> categoryRequestService.rejectRequest(user, requestId, new CategoryRequestDecisionRequest()));
    }

    @Test
    void getAllRequests_WithStatus() {
        when(categoryRequestRepository.findByStatusOrderByCreatedAtDesc(CategoryRequestStatus.PENDING)).thenReturn(Collections.emptyList());

        List<CategoryRequestDto> result = categoryRequestService.getAllRequests(CategoryRequestStatus.PENDING);
        assertTrue(result.isEmpty());
    }

    @Test
    void getAllRequests_WithoutStatus() {
        when(categoryRequestRepository.findAllByOrderByCreatedAtDesc()).thenReturn(Collections.emptyList());

        List<CategoryRequestDto> result = categoryRequestService.getAllRequests(null);
        assertTrue(result.isEmpty());
    }
}
