-- Add color column to columns table
ALTER TABLE columns ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'gray';

-- Update existing columns to have default gray color
UPDATE columns SET color = 'gray' WHERE color IS NULL;
