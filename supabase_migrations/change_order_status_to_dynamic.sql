-- Change order status to be dynamic (column name based)
-- Instead of fixed statuses, allow any column name as status

-- Step 1: Remove old check constraint if exists
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_status_check;

-- Step 2: Change status column type to TEXT for flexibility
-- (VARCHAR is limited, TEXT allows any column name)
ALTER TABLE orders
ALTER COLUMN status TYPE TEXT;

-- Step 3: Set default status for new orders
ALTER TABLE orders
ALTER COLUMN status SET DEFAULT 'ממתין';

-- Step 4: Add index for better performance on status filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Step 5: Update existing orders with old enum values to readable names
-- This is optional - run only if you have old data with 'new', 'in_progress', etc.
UPDATE orders SET status = 'חדש' WHERE status = 'new';
UPDATE orders SET status = 'בתהליך' WHERE status = 'in_progress';
UPDATE orders SET status = 'הושלם' WHERE status = 'completed';
UPDATE orders SET status = 'בוטל' WHERE status = 'cancelled';

-- Step 6: Add comment explaining the dynamic status
COMMENT ON COLUMN orders.status IS 'Dynamic status matching column name in task board. Examples: ממתין, בדפוס, מוכן לאיסוף, בוטל';

-- Step 7: Drop the old order_status column from columns table (not needed anymore)
ALTER TABLE columns
DROP COLUMN IF EXISTS order_status;
