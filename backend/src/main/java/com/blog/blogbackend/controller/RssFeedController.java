package com.blog.blogbackend.controller;

import com.blog.blogbackend.dto.PostResponse;
import com.blog.blogbackend.entity.PostStatus;
import com.blog.blogbackend.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@RestController
public class RssFeedController {

    @Autowired
    private PostRepository postRepository;

    @Value("${app.base-url:http://localhost}")
    private String baseUrl;

    private static final DateTimeFormatter RFC_822_FORMATTER = DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss Z", Locale.ENGLISH);

    @GetMapping(value = "/api/feed.rss", produces = "application/rss+xml; charset=UTF-8")
    public String getRssFeed() {
        var posts = postRepository.findByStatus(PostStatus.PUBLISHED, PageRequest.of(0, 20, Sort.by("publishedAt").descending()));

        StringBuilder rss = new StringBuilder();
        rss.append("<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n");
        rss.append("<rss version=\"2.0\">\n");
        rss.append("<channel>\n");
        rss.append("  <title>Blog Platform</title>\n");
        rss.append("  <link>").append(baseUrl).append("</link>\n");
        rss.append("  <description>Latest posts from Blog Platform</description>\n");

        for (var post : posts) {
            rss.append("  <item>\n");
            rss.append("    <title>").append(escapeXml(post.getTitle())).append("</title>\n");
            rss.append("    <link>").append(baseUrl).append("/posts/").append(post.getSlug()).append("</link>\n");
            rss.append("    <description>").append(escapeXml(post.getExcerpt())).append("</description>\n");
            if (post.getPublishedAt() != null) {
                rss.append("    <pubDate>").append(post.getPublishedAt().atZone(ZoneId.of("UTC")).format(RFC_822_FORMATTER)).append("</pubDate>\n");
            }
            rss.append("    <guid>").append(baseUrl).append("/posts/").append(post.getSlug()).append("</guid>\n");
            rss.append("  </item>\n");
        }

        rss.append("</channel>\n");
        rss.append("</rss>");

        return rss.toString();
    }

    private String escapeXml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
