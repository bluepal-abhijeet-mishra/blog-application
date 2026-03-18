CREATE TABLE author_applications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    bio TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    evaluated_at TIMESTAMP WITHOUT TIME ZONE,
    rejection_reason TEXT,
    CONSTRAINT fk_author_applications_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_author_applications_user_id ON author_applications(user_id);
CREATE INDEX idx_author_applications_status ON author_applications(status);
