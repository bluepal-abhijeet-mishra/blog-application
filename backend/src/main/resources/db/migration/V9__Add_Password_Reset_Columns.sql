ALTER TABLE users
    ADD COLUMN password_reset_token_hash VARCHAR(64),
    ADD COLUMN password_reset_expires_at TIMESTAMP,
    ADD COLUMN password_reset_requested_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_password_reset_token_hash
    ON users (password_reset_token_hash);
