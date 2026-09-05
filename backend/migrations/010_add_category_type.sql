ALTER TABLE categories
ADD COLUMN IF NOT EXISTS type VARCHAR(20);

UPDATE categories
SET type = CASE
    WHEN name IN (
        'Salary',
        'Freelance',
        'Business',
        'Investment',
        'Rental Income',
        'Bonus',
        'Interest',
        'Gift',
        'Other Income'
    ) THEN 'income'
    ELSE 'expense'
END
WHERE type IS NULL;

ALTER TABLE categories
ALTER COLUMN type SET DEFAULT 'expense';

ALTER TABLE categories
ALTER COLUMN type SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'valid_category_type'
          AND conrelid = 'categories'::regclass
    ) THEN
        ALTER TABLE categories
        ADD CONSTRAINT valid_category_type
        CHECK (type IN ('income', 'expense'));
    END IF;
END $$;
