CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_budget_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_budget_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE CASCADE,
    CONSTRAINT positive_budget_amount
        CHECK (amount > 0),
    CONSTRAINT valid_budget_month
        CHECK (month BETWEEN 1 AND 12),
    CONSTRAINT valid_budget_year
        CHECK (year >= 2000),
    CONSTRAINT unique_family_category_month
        UNIQUE (family_id, category_id, month, year)
);