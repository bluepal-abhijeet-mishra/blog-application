package com.blog.blogbackend.controller;

import com.blog.blogbackend.entity.Post;
import com.blog.blogbackend.entity.PostStatus;
import com.blog.blogbackend.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

@RestController
public class RssFeedController {

    @Autowired
    private PostRepository postRepository;

    private static final DateTimeFormatter RFC_822_FORMATTER = DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss Z", Locale.ENGLISH);
    private static final MediaType RSS_MEDIA_TYPE = MediaType.parseMediaType("application/rss+xml; charset=UTF-8");

    @GetMapping(value = "/api/feed.rss", produces = "application/rss+xml; charset=UTF-8")
    @Cacheable(value = "rss-feed", key = "#request.getHeader('X-Forwarded-Host') ?: #request.getServerName()")
    public ResponseEntity<String> getRssFeed(HttpServletRequest request) {
        String requestBaseUrl = getRequestBaseUrl(request);
        var posts = postRepository.findTop20ByStatusOrderByPublishedAtDesc(PostStatus.PUBLISHED);
        String feedXml = buildRssXml(posts, requestBaseUrl);

        return ResponseEntity.ok()
                .contentType(RSS_MEDIA_TYPE)
                .header(HttpHeaders.CONTENT_TYPE, "application/rss+xml; charset=UTF-8")
                .cacheControl(CacheControl.maxAge(1, TimeUnit.MINUTES).cachePublic())
                .body(feedXml);
    }

    private String getRequestBaseUrl(HttpServletRequest request) {
        // First check for X-Forwarded headers (common in proxies/ngrok)
        String protocol = request.getHeader("X-Forwarded-Proto");
        String host = request.getHeader("X-Forwarded-Host");

        if (protocol != null && host != null) {
            return protocol + "://" + host;
        }

        // Fallback to the direct request URL if headers are missing
        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();

        StringBuilder url = new StringBuilder();
        url.append(scheme).append("://").append(serverName);

        if (("http".equals(scheme) && serverPort != 80) || ("https".equals(scheme) && serverPort != 443)) {
            url.append(":").append(serverPort);
        }

        return url.toString();
    }

    private String buildRssXml(Iterable<Post> posts, String sanitizedBaseUrl) {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        String feedUrl = sanitizedBaseUrl + "/api/feed.rss";
        StringBuilder rss = new StringBuilder();
        rss.append("<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n");
        rss.append("<!-- Generated at: ").append(now).append(" -->\n");
        rss.append("<rss version=\"2.0\" xmlns:atom=\"http://www.w3.org/2005/Atom\">\n");
        rss.append("<channel>\n");
        rss.append("  <title>BlogSpace</title>\n");
        rss.append("  <link>").append(escapeXml(sanitizedBaseUrl)).append("</link>\n");
        rss.append("  <description>Latest published posts from BlogSpace</description>\n");
        rss.append("  <language>en-us</language>\n");
        rss.append("  <atom:link href=\"").append(escapeXml(feedUrl)).append("\" rel=\"self\" type=\"application/rss+xml\" />\n");
        rss.append("  <lastBuildDate>").append(formatRfc822(now)).append("</lastBuildDate>\n");

        for (var post : posts) {
            String postUrl = sanitizedBaseUrl + "/posts/" + post.getSlug();
            LocalDateTime publishTimestamp = post.getPublishedAt() != null ? post.getPublishedAt() : post.getCreatedAt();

            rss.append("  <item>\n");
            rss.append("    <title>").append(escapeXml(post.getTitle())).append("</title>\n");
            rss.append("    <link>").append(escapeXml(postUrl)).append("</link>\n");
            rss.append("    <description>").append(escapeXml(post.getExcerpt())).append("</description>\n");
            if (publishTimestamp != null) {
                rss.append("    <pubDate>").append(formatRfc822(publishTimestamp)).append("</pubDate>\n");
            }
            rss.append("    <guid isPermaLink=\"true\">").append(escapeXml(postUrl)).append("</guid>\n");
            rss.append("  </item>\n");
        }

        rss.append("</channel>\n");
        rss.append("</rss>");
        return rss.toString();
    }

    private String formatRfc822(LocalDateTime dateTime) {
        return dateTime.atOffset(ZoneOffset.UTC).format(RFC_822_FORMATTER);
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
