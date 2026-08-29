CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_category_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,
    CONSTRAINT unique_category_name
        UNIQUE (family_id, name)
);