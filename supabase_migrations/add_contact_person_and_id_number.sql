-- Add contact person and ID number to orders table
-- For invoice billing details (contact person, tax ID or company number)

-- Step 1: Add contact_person column (optional - defaults to customer name)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS contact_person TEXT;

-- Step 2: Add id_number column for Tax ID (ת"ז) or Company Number (ח.פ)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS id_number TEXT;

-- Step 3: Add comments explaining the columns
COMMENT ON COLUMN orders.contact_person IS 'איש קשר נוסף - מעבר לשם הלקוח. אופציונלי.';
COMMENT ON COLUMN orders.id_number IS 'תעודת זהות או חברה פורטל - לחשבונית';

-- Step 4: Create index for better search performance on id_number
CREATE INDEX IF NOT EXISTS idx_orders_id_number ON orders(id_number);
