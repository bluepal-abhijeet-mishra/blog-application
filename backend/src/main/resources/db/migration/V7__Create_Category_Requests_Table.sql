CREATE TABLE category_requests (
    id UUID PRIMARY KEY,
    requested_by UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(140) NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by UUID,
    review_note TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_category_requests_requested_by FOREIGN KEY (requested_by) REFERENCES users(id),
    CONSTRAINT fk_category_requests_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE INDEX idx_category_requests_requested_by ON category_requests(requested_by);
CREATE INDEX idx_category_requests_status ON category_requests(status);
CREATE INDEX idx_category_requests_slug ON category_requests(slug);
CREATE UNIQUE INDEX uq_category_requests_pending_slug ON category_requests(slug) WHERE status = 'PENDING';
