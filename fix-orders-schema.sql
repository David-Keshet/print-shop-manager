-- Fix orders table schema - ensure all required columns exist
-- Run this in Supabase SQL Editor

-- Step 1: Add notes column if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 2: Add contact_person column if it doesn't exist
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS contact_person TEXT;

-- Step 3: Add id_number column if it doesn't exist
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS id_number TEXT;

-- Step 4: Verify columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
