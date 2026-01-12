-- Add order_status field to columns table
-- This allows each column to define which order status it represents

-- Step 1: Add the column
ALTER TABLE columns
ADD COLUMN IF NOT EXISTS order_status VARCHAR(50) DEFAULT 'in_progress';

-- Step 2: Add a check constraint to ensure valid statuses
ALTER TABLE columns
ADD CONSTRAINT columns_order_status_check
CHECK (order_status IN ('new', 'in_progress', 'completed', 'cancelled') OR order_status IS NULL);

-- Step 3: Update existing columns with appropriate statuses based on their names
-- These are suggestions - adjust based on your actual column names

UPDATE columns SET order_status = 'new'
WHERE name ILIKE '%ממתין%' OR name ILIKE '%חדש%';

UPDATE columns SET order_status = 'in_progress'
WHERE name ILIKE '%בביצוע%'
   OR name ILIKE '%בגרפיקה%'
   OR name ILIKE '%בדפוס%'
   OR name ILIKE '%בגימור%'
   OR name ILIKE '%מחכה לאישור%';

UPDATE columns SET order_status = 'completed'
WHERE name ILIKE '%מוכן%'
   OR name ILIKE '%הושלם%'
   OR name ILIKE '%נמסר%'
   OR name ILIKE '%הסתיים%';

UPDATE columns SET order_status = 'cancelled'
WHERE name ILIKE '%בוטל%'
   OR name ILIKE '%ביטול%';

-- Step 4: Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_columns_order_status ON columns(order_status);

-- Step 5: Add comment explaining the field
COMMENT ON COLUMN columns.order_status IS 'Status to set on orders when moved to this column: new, in_progress, completed, cancelled';
