-- Migration 007: Sequences for unique numbering across all machines
-- This ensures no duplicate order/invoice numbers even with multiple machines working simultaneously

-- ============================================
-- 1. CREATE SEQUENCES
-- ============================================

-- Sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001;

-- Sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1001;

-- Sequence for customer IDs (optional, but useful)
CREATE SEQUENCE IF NOT EXISTS customer_number_seq START WITH 1001;

-- ============================================
-- 2. CREATE FUNCTIONS TO GET NEXT NUMBERS
-- ============================================

-- Function to get next order number
CREATE OR REPLACE FUNCTION get_next_order_number()
RETURNS TABLE(next_number INTEGER) AS $$
BEGIN
  RETURN QUERY SELECT nextval('order_number_seq')::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next invoice number
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS TABLE(next_number INTEGER) AS $$
BEGIN
  RETURN QUERY SELECT nextval('invoice_number_seq')::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next customer number
CREATE OR REPLACE FUNCTION get_next_customer_number()
RETURNS TABLE(next_number INTEGER) AS $$
BEGIN
  RETURN QUERY SELECT nextval('customer_number_seq')::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. ADD COLUMNS FOR OFFLINE SYNC
-- ============================================

-- Add offline tracking columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS is_offline BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'conflict')),
ADD COLUMN IF NOT EXISTS local_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ DEFAULT NOW();

-- Add offline tracking columns to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS is_offline BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'conflict')),
ADD COLUMN IF NOT EXISTS customer_number INTEGER,
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ DEFAULT NOW();

-- Add offline tracking columns to invoices table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS is_offline BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'conflict')),
    ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_sync_status ON orders(sync_status);
CREATE INDEX IF NOT EXISTS idx_orders_is_offline ON orders(is_offline);
CREATE INDEX IF NOT EXISTS idx_orders_last_modified ON orders(last_modified_at DESC);

CREATE INDEX IF NOT EXISTS idx_customers_sync_status ON customers(sync_status);
CREATE INDEX IF NOT EXISTS idx_customers_customer_number ON customers(customer_number);

-- ============================================
-- 5. CREATE TRIGGER TO UPDATE last_modified_at
-- ============================================

-- Function to update last_modified_at
CREATE OR REPLACE FUNCTION update_last_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for orders
DROP TRIGGER IF EXISTS update_orders_last_modified ON orders;
CREATE TRIGGER update_orders_last_modified
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_last_modified_column();

-- Trigger for customers
DROP TRIGGER IF EXISTS update_customers_last_modified ON customers;
CREATE TRIGGER update_customers_last_modified
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_last_modified_column();

-- ============================================
-- 6. SET CURRENT SEQUENCE VALUES
-- ============================================

-- Set sequences to start from current max + 1
DO $$
DECLARE
  max_order_num INTEGER;
  max_invoice_num INTEGER;
  max_customer_num INTEGER;
BEGIN
  -- Get max order number
  SELECT COALESCE(MAX(order_number), 1000) INTO max_order_num FROM orders WHERE order_number IS NOT NULL;
  PERFORM setval('order_number_seq', max_order_num + 1, false);

  -- Get max invoice number (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    SELECT COALESCE(MAX(invoice_number), 1000) INTO max_invoice_num FROM invoices WHERE invoice_number IS NOT NULL;
    PERFORM setval('invoice_number_seq', max_invoice_num + 1, false);
  END IF;

  -- Get max customer number
  SELECT COALESCE(MAX(customer_number), 1000) INTO max_customer_num FROM customers WHERE customer_number IS NOT NULL;
  PERFORM setval('customer_number_seq', max_customer_num + 1, false);
END $$;

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_next_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_invoice_number() TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_customer_number() TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON SEQUENCE order_number_seq TO authenticated;
GRANT USAGE ON SEQUENCE invoice_number_seq TO authenticated;
GRANT USAGE ON SEQUENCE customer_number_seq TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- View to check sequence status
CREATE OR REPLACE VIEW sequence_status AS
SELECT
  'order_number_seq' as sequence_name,
  last_value as current_value,
  is_called
FROM order_number_seq
UNION ALL
SELECT
  'invoice_number_seq' as sequence_name,
  last_value as current_value,
  is_called
FROM invoice_number_seq
UNION ALL
SELECT
  'customer_number_seq' as sequence_name,
  last_value as current_value,
  is_called
FROM customer_number_seq;

COMMENT ON VIEW sequence_status IS 'View to monitor sequence current values';
