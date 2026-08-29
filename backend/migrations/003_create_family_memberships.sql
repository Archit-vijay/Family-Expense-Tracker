CREATE TABLE IF NOT EXISTS family_memberships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    family_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_membership_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_membership_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,
    CONSTRAINT unique_user_family
        UNIQUE (user_id, family_id),
    CONSTRAINT valid_family_role
        CHECK (role IN ('admin', 'member', 'viewer'))
);