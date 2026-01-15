-- Add icount_doc_number field to orders table
-- This will store the original iCount document number

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS icount_doc_number TEXT;

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_orders_icount_doc_number ON orders(icount_doc_number);

-- Add comment
COMMENT ON COLUMN orders.icount_doc_number IS 'מספר מסמך מקורי מ-iCount';

-- Show current orders table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
