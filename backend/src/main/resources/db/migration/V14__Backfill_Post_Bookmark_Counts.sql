UPDATE posts p
SET like_count = (
    SELECT COUNT(*)
    FROM saved_posts sp
    WHERE sp.post_id = p.id
);
