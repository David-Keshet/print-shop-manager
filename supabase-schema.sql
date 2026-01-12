-- Print Shop Manager Database Schema
-- Run this SQL in Supabase SQL Editor

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  vat DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_with_vat DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create columns table (for Kanban board)
CREATE TABLE IF NOT EXISTS columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT 'gray',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  column_id UUID REFERENCES columns(id) ON DELETE CASCADE NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  title TEXT,
  description TEXT,
  notes TEXT,
  labels TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table (for user management)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create settings table (for system settings)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_tasks_order_id ON tasks(order_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_columns_department_id ON columns(department_id);

-- Insert initial departments
INSERT INTO departments (name, position) VALUES
  ('מזכירות', 0),
  ('עיצוב', 1),
  ('הדפסה', 2),
  ('גימור', 3),
  ('משלוחים', 4)
ON CONFLICT DO NOTHING;

-- Insert initial columns for each department
INSERT INTO columns (department_id, name, position)
SELECT
  d.id,
  c.name,
  c.position
FROM departments d
CROSS JOIN (
  VALUES
    ('ממתין', 0),
    ('בתהליך', 1),
    ('הושלם', 2)
) AS c(name, position)
ON CONFLICT DO NOTHING;

-- Insert initial settings
INSERT INTO settings (key, value, description) VALUES
  ('whatsapp_new_order', 'שלום {customer_name}, נפתחה עבורך הזמנה מספר {order_number}. נעדכן אותך על התקדמות ההזמנה. תודה!', 'הודעת WhatsApp להזמנה חדשה'),
  ('whatsapp_order_ready', 'שלום {customer_name}, הזמנה מספר {order_number} מוכנה לאיסוף!', 'הודעת WhatsApp להזמנה מוכנה'),
  ('company_name', 'דפוס קשת', 'שם החברה'),
  ('company_phone', '03-1234567', 'טלפון החברה'),
  ('company_email', 'info@printshop.co.il', 'אימייל החברה')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security (RLS) - Optional but recommended for production
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simple policies (allows all operations for now - adjust for production)
-- CREATE POLICY "Allow all operations" ON customers FOR ALL USING (true);
-- CREATE POLICY "Allow all operations" ON orders FOR ALL USING (true);
-- CREATE POLICY "Allow all operations" ON order_items FOR ALL USING (true);
-- CREATE POLICY "Allow all operations" ON departments FOR ALL USING (true);
-- CREATE POLICY "Allow all operations" ON columns FOR ALL USING (true);
-- CREATE POLICY "Allow all operations" ON tasks FOR ALL USING (true);
-- CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
