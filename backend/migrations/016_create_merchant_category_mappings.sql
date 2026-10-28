-- Migration 016: Create merchant category mappings table for smart statement import and categorization learning

CREATE TABLE IF NOT EXISTS merchant_category_mappings (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    merchant_pattern VARCHAR(120) NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_family_merchant UNIQUE (family_id, merchant_pattern)
);

CREATE INDEX IF NOT EXISTS idx_merchant_mappings_family ON merchant_category_mappings(family_id);
CREATE INDEX IF NOT EXISTS idx_merchant_mappings_pattern ON merchant_category_mappings(family_id, merchant_pattern);
