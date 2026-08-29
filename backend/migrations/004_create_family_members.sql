CREATE TABLE IF NOT EXISTS family_members (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_family_member_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE
);