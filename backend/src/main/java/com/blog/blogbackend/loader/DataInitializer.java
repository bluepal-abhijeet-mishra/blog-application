package com.blog.blogbackend.loader;

import com.blog.blogbackend.entity.Category;
import com.blog.blogbackend.entity.Post;
import com.blog.blogbackend.entity.PostStatus;
import com.blog.blogbackend.entity.Role;
import com.blog.blogbackend.entity.Tag;
import com.blog.blogbackend.entity.User;
import com.blog.blogbackend.repository.CategoryRepository;
import com.blog.blogbackend.repository.PostRepository;
import com.blog.blogbackend.repository.TagRepository;
import com.blog.blogbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final PostRepository postRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Value("${app.seed.admin.email:}")
    private String seedAdminEmail;

    @Value("${app.seed.admin.password:}")
    private String seedAdminPassword;

    @Value("${app.seed.admin.display-name:System Administrator}")
    private String seedAdminDisplayName;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting professional data initialization sequence...");
        
        seedAdminUser();
        seedCategories();
        seedTags();
        seedPosts();
        
        log.info("Data initialization sequence completed successfully.");
    }

    private void seedPosts() {
        if (postRepository.count() > 0) return;

        if (seedAdminEmail == null || seedAdminEmail.isBlank()) return;
        User admin = userRepository.findByEmail(seedAdminEmail).orElse(null);
        if (admin == null) return;

        Category tech = categoryRepository.findBySlug("technology").orElse(null);
        Category business = categoryRepository.findBySlug("business").orElse(null);

        if (tech != null) {
            Post p1 = Post.builder()
                .title("The Future of Agentic AI in Modern Software Ecosystems")
                .slug("future-of-agentic-ai")
                .content("{\"type\":\"doc\",\"content\":[{\"type\":\"heading\",\"attrs\":{\"level\":2},\"content\":[{\"type\":\"text\",\"text\":\"The Shift to Autonomy\"}]},{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"As we transition from traditional automation to true agentic workflows, the landscape of software development is undergoing a fundamental shift. Agents are no longer just scripts; they are persistent entities capable of reasoning and executing complex objectives...\"}]}]}")
                .excerpt("Exploring the fundamental shift from traditional automation to true autonomous agentic workflows in modern software development.")
                .coverImageUrl("https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1400&q=80")
                .status(PostStatus.PUBLISHED)
                .publishedAt(LocalDateTime.now())
                .author(admin)
                .category(tech)
                .build();
            postRepository.save(p1);
        }

        if (business != null) {
            Post p2 = Post.builder()
                .title("Scaling Startups: The Lean Integration Method")
                .slug("scaling-startups-lean")
                .content("{\"type\":\"doc\",\"content\":[{\"type\":\"heading\",\"attrs\":{\"level\":2},\"content\":[{\"type\":\"text\",\"text\":\"Efficiency at Scale\"}]},{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"In the competitive startup landscape, the ability to integrate professional workflows rapidly is the difference between success and obsolescence. The lean integration method focuses on minimum viable infrastructure that scales dynamically...\"}]}]}")
                .excerpt("A deep dive into the lean integration method for scaling startup infrastructure without sacrificing professional standards.")
                .coverImageUrl("https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80")
                .status(PostStatus.PUBLISHED)
                .publishedAt(LocalDateTime.now())
                .author(admin)
                .category(business)
                .build();
            postRepository.save(p2);
        }

        log.info("Seeded professional sample stories.");
    }

    private void seedAdminUser() {
        if (seedAdminEmail == null || seedAdminEmail.isBlank() || seedAdminPassword == null || seedAdminPassword.isBlank()) {
            log.info("No admin seed credentials provided. Skipping admin user seeding.");
            return;
        }

        if (!userRepository.existsByEmail(seedAdminEmail)) {
            User admin = User.builder()
                    .email(seedAdminEmail)
                    .password(passwordEncoder.encode(seedAdminPassword))
                    .displayName(seedAdminDisplayName)
                    .role(Role.ADMIN)
                    .bio("Primary system administrator for the BlogSpace platform.")
                    .build();
            userRepository.save(admin);
            log.info("Seeded default administrator account: {}", seedAdminEmail);
        } else {
            log.info("Administrator account already exists. Skipping user seeding.");
        }
    }

    private void seedCategories() {
        List<String> categories = Arrays.asList(
            "Technology", "Lifestyle", "Business", "Science", "Health", "Art", "Travel"
        );

        for (String name : categories) {
            String slug = name.toLowerCase();
            if (categoryRepository.findBySlug(slug).isEmpty()) {
                Category category = Category.builder()
                        .name(name)
                        .slug(slug)
                        .description("Professional articles related to " + name)
                        .build();
                categoryRepository.save(category);
                log.info("Seeded category: {}", name);
            }
        }
    }

    private void seedTags() {
        List<String> tags = Arrays.asList(
            "AI", "WebDev", "Startup", "Productivity", "Future", "Programming", "Design"
        );

        for (String name : tags) {
            String slug = name.toLowerCase();
            if (tagRepository.findBySlug(slug).isEmpty()) {
                Tag tag = Tag.builder()
                        .name(name)
                        .slug(slug)
                        .build();
                tagRepository.save(tag);
                log.info("Seeded tag: #{}", name);
            }
        }
    }
}
