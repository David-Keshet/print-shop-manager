-- Create auto_transfer_rules table for automatic task transfers
CREATE TABLE IF NOT EXISTS auto_transfer_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_column_id UUID REFERENCES columns(id) ON DELETE CASCADE NOT NULL,
  target_department_id UUID REFERENCES departments(id) ON DELETE CASCADE NOT NULL,
  target_column_id UUID REFERENCES columns(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auto_transfer_trigger_column ON auto_transfer_rules(trigger_column_id);
CREATE INDEX IF NOT EXISTS idx_auto_transfer_target_department ON auto_transfer_rules(target_department_id);
CREATE INDEX IF NOT EXISTS idx_auto_transfer_target_column ON auto_transfer_rules(target_column_id);

-- Enable Row Level Security
ALTER TABLE auto_transfer_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow read access to auto_transfer_rules" ON auto_transfer_rules FOR SELECT USING (true);
CREATE POLICY "Allow insert access to auto_transfer_rules" ON auto_transfer_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to auto_transfer_rules" ON auto_transfer_rules FOR UPDATE USING (true);
CREATE POLICY "Allow delete access to auto_transfer_rules" ON auto_transfer_rules FOR DELETE USING (true);

-- Insert sample auto-transfer rule (example: when task moves to 'מוכן' in any department, move to 'ממתין' in 'משלוחים')
-- This is just an example, you can modify it according to your needs
INSERT INTO auto_transfer_rules (trigger_column_id, target_department_id, target_column_id)
SELECT 
  c.id as trigger_column_id,
  d_target.id as target_department_id,
  c_target.id as target_column_id
FROM columns c
CROSS JOIN departments d_target
CROSS JOIN columns c_target
WHERE c.name = 'מוכן' 
  AND d_target.name = 'משלוחים'
  AND c_target.name = 'ממתין'
  AND c_target.department_id = d_target.id
LIMIT 1
ON CONFLICT DO NOTHING;
