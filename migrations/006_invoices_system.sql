-- טבלה להגדרות iCount
CREATE TABLE IF NOT EXISTS icount_settings (
  id SERIAL PRIMARY KEY,
  cid VARCHAR(50),
  user_name VARCHAR(100),
  encrypted_pass TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'pending',
  offline_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- טבלה לחשבוניות
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,

  -- קישור להזמנה
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- פרטי חשבונית
  invoice_number VARCHAR(50) UNIQUE,
  invoice_type VARCHAR(50) NOT NULL, -- invoice, invoice_receipt, receipt, credit

  -- תאריכים
  issue_date DATE NOT NULL,
  due_date DATE,
  payment_date DATE,

  -- סכומים
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  vat_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10, 2) DEFAULT 0,

  -- סטטוס
  status VARCHAR(50) DEFAULT 'draft', -- draft, pending, sent, paid, cancelled, overdue
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, partially_paid, paid

  -- אמצעי תשלום
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),

  -- סנכרון עם iCount
  icount_doc_id VARCHAR(100) UNIQUE,
  synced_at TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'pending', -- pending, synced, failed
  sync_error TEXT,
  last_sync_attempt TIMESTAMP,

  -- מסמך קשור (למשל חשבונית זיכוי מקושרת לחשבונית מקורית)
  related_invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,

  -- הערות
  notes TEXT,
  internal_notes TEXT,

  -- מי יצר ועדכן
  created_by UUID,
  updated_by UUID,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- טבלה לפריטים בחשבונית
CREATE TABLE IF NOT EXISTS invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,

  -- פרטי פריט
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- מע"מ
  vat_rate DECIMAL(5, 2) DEFAULT 17.00,
  vat_amount DECIMAL(10, 2) DEFAULT 0,

  -- סה"כ
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- קישור לפריט במלאי (אם רלוונטי)
  item_code VARCHAR(50),

  -- מיקום (שורה)
  line_number INTEGER,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- טבלה לתשלומים
CREATE TABLE IF NOT EXISTS invoice_payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,

  -- פרטי תשלום
  payment_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,

  -- פרטים נוספים
  reference_number VARCHAR(100),
  check_number VARCHAR(50),
  bank_name VARCHAR(100),

  -- סנכרון
  icount_payment_id VARCHAR(100),
  synced_at TIMESTAMP,

  notes TEXT,

  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- טבלה ללוג סנכרון
CREATE TABLE IF NOT EXISTS sync_log (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- invoice, customer, payment
  entity_id INTEGER NOT NULL,

  operation VARCHAR(50) NOT NULL, -- create, update, delete
  direction VARCHAR(50) NOT NULL, -- to_icount, from_icount

  status VARCHAR(50) NOT NULL, -- success, failed, pending
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,

  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_icount_doc_id ON invoices(icount_doc_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_entity ON sync_log(entity_type, entity_id);

-- Triggers לעדכון updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_payments_updated_at BEFORE UPDATE ON invoice_payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_icount_settings_updated_at BEFORE UPDATE ON icount_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views לדוחות

-- View: חשבוניות פעילות
CREATE OR REPLACE VIEW active_invoices AS
SELECT
  i.*,
  c.name as customer_name,
  c.phone as customer_phone,
  o.order_number,
  (i.total_amount - COALESCE(i.paid_amount, 0)) as balance
FROM invoices i
LEFT JOIN customers c ON i.customer_id = c.id
LEFT JOIN orders o ON i.order_id = o.id
WHERE i.status != 'cancelled';

-- View: חשבוניות לתשלום
CREATE OR REPLACE VIEW invoices_due AS
SELECT
  i.*,
  c.name as customer_name,
  c.phone as customer_phone,
  (i.total_amount - COALESCE(i.paid_amount, 0)) as balance,
  CASE
    WHEN i.due_date < CURRENT_DATE THEN 'overdue'
    WHEN i.due_date = CURRENT_DATE THEN 'due_today'
    ELSE 'upcoming'
  END as urgency
FROM invoices i
LEFT JOIN customers c ON i.customer_id = c.id
WHERE i.payment_status != 'paid'
  AND i.status NOT IN ('draft', 'cancelled')
ORDER BY i.due_date ASC;

-- View: סיכום חובות לקוחות
CREATE OR REPLACE VIEW customer_balances AS
SELECT
  c.id as customer_id,
  c.name as customer_name,
  COUNT(i.id) as invoice_count,
  SUM(i.total_amount) as total_invoiced,
  SUM(i.paid_amount) as total_paid,
  SUM(i.total_amount - COALESCE(i.paid_amount, 0)) as balance,
  MAX(i.due_date) as latest_due_date,
  COUNT(CASE WHEN i.due_date < CURRENT_DATE AND i.payment_status != 'paid' THEN 1 END) as overdue_count
FROM customers c
LEFT JOIN invoices i ON c.id = i.customer_id
WHERE i.status != 'cancelled'
GROUP BY c.id, c.name
HAVING SUM(i.total_amount - COALESCE(i.paid_amount, 0)) > 0
ORDER BY balance DESC;

-- הוספת עמודות חדשות לטבלת orders (אם לא קיימות)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='invoiced') THEN
    ALTER TABLE orders ADD COLUMN invoiced BOOLEAN DEFAULT false;
  END IF;
END $$;

-- הוספת עמודות לטבלת customers עבור פרטי חשבונית
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='email') THEN
    ALTER TABLE customers ADD COLUMN email VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='tax_id') THEN
    ALTER TABLE customers ADD COLUMN tax_id VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='company_name') THEN
    ALTER TABLE customers ADD COLUMN company_name VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='billing_address') THEN
    ALTER TABLE customers ADD COLUMN billing_address TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='city') THEN
    ALTER TABLE customers ADD COLUMN city VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='postal_code') THEN
    ALTER TABLE customers ADD COLUMN postal_code VARCHAR(20);
  END IF;
END $$;

COMMENT ON TABLE invoices IS 'טבלה לניהול חשבוניות - תומכת בחשבונית רגילה, חשבונית מס קבלה, קבלה וזיכוי';
COMMENT ON TABLE invoice_items IS 'פירוט פריטים בחשבונית';
COMMENT ON TABLE invoice_payments IS 'תשלומים על חשבוניות';
COMMENT ON TABLE sync_log IS 'לוג סנכרון עם iCount';
