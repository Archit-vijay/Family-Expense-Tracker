ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS user_id INTEGER;

ALTER TABLE family_members
ADD CONSTRAINT fk_family_member_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_family_member_user
    ON family_members(user_id)
    WHERE user_id IS NOT NULL;