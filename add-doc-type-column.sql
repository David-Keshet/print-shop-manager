-- Add doc_type column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS doc_type TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
  AND column_name = 'doc_type';
