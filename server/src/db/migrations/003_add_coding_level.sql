ALTER TABLE users ADD COLUMN IF NOT EXISTS coding_level VARCHAR(20) NOT NULL DEFAULT 'intermediate' CHECK(coding_level IN ('beginner','intermediate','advanced'));
