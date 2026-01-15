-- ==============================================
-- מערכת מספור הזמנות בטוחה
-- מונע כפילויות גם כש-10 מחשבים עובדים במקביל
-- ==============================================

-- טבלת counters למספור
CREATE TABLE IF NOT EXISTS counters (
  id TEXT PRIMARY KEY,
  current_value BIGINT NOT NULL DEFAULT 0,
  prefix TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- הכנסת ערכים התחלתיים (אם לא קיימים)
INSERT INTO counters (id, current_value, prefix)
VALUES
  ('order_number', 1000, NULL),
  ('customer_number', 100, 'C'),
  ('invoice_number', 1, 'INV')
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- פונקציה לקבלת מספר הזמנה הבא (אטומית ובטוחה)
-- ==============================================
CREATE OR REPLACE FUNCTION get_next_order_number()
RETURNS BIGINT AS $$
DECLARE
  next_num BIGINT;
BEGIN
  -- נעילה + עדכון + החזרה באופן אטומי
  UPDATE counters
  SET current_value = current_value + 1,
      updated_at = NOW()
  WHERE id = 'order_number'
  RETURNING current_value INTO next_num;

  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- פונקציה לקבלת מספר לקוח הבא
-- ==============================================
CREATE OR REPLACE FUNCTION get_next_customer_number()
RETURNS BIGINT AS $$
DECLARE
  next_num BIGINT;
BEGIN
  UPDATE counters
  SET current_value = current_value + 1,
      updated_at = NOW()
  WHERE id = 'customer_number'
  RETURNING current_value INTO next_num;

  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- פונקציה לקבלת מספר חשבונית הבא
-- ==============================================
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS BIGINT AS $$
DECLARE
  next_num BIGINT;
BEGIN
  UPDATE counters
  SET current_value = current_value + 1,
      updated_at = NOW()
  WHERE id = 'invoice_number'
  RETURNING current_value INTO next_num;

  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- הפעלת Realtime על הטבלאות הרלוונטיות
-- ==============================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;

-- ==============================================
-- הוספת עמודות נדרשות לטבלאות (אם חסרות)
-- ==============================================

-- orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_offline BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS temp_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_offline BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_offline BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ==============================================
-- Trigger לעדכון last_modified_at אוטומטי
-- ==============================================
CREATE OR REPLACE FUNCTION update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Orders trigger
DROP TRIGGER IF EXISTS orders_last_modified ON orders;
CREATE TRIGGER orders_last_modified
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_last_modified();

-- Customers trigger
DROP TRIGGER IF EXISTS customers_last_modified ON customers;
CREATE TRIGGER customers_last_modified
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_last_modified();

-- Invoices trigger
DROP TRIGGER IF EXISTS invoices_last_modified ON invoices;
CREATE TRIGGER invoices_last_modified
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_last_modified();

-- ==============================================
-- הרשאות RPC
-- ==============================================
GRANT EXECUTE ON FUNCTION get_next_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_order_number() TO anon;
GRANT EXECUTE ON FUNCTION get_next_customer_number() TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_customer_number() TO anon;
GRANT EXECUTE ON FUNCTION get_next_invoice_number() TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_invoice_number() TO anon;
