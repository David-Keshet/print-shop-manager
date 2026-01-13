-- Create custom labels table
CREATE TABLE IF NOT EXISTS custom_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT 'bg-blue-500',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default labels from constants
INSERT INTO custom_labels (name, color, position) VALUES
  ('דחוף', 'bg-red-500', 1),
  ('חשוב', 'bg-orange-500', 2),
  ('רגיל', 'bg-blue-500', 3),
  ('נמוך', 'bg-gray-500', 4),
  ('ממתין', 'bg-yellow-500', 5),
  ('בטיפול', 'bg-purple-500', 6),
  ('הושלם', 'bg-green-500', 7),
  ('מבוטל', 'bg-pink-500', 8),
  ('לבדיקה', 'bg-cyan-500', 9),
  ('VIP', 'bg-amber-500', 10)
ON CONFLICT (name) DO NOTHING;

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_custom_labels_position ON custom_labels(position);

-- Enable RLS
ALTER TABLE custom_labels ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "custom_labels_select_policy" ON custom_labels;
DROP POLICY IF EXISTS "custom_labels_insert_policy" ON custom_labels;
DROP POLICY IF EXISTS "custom_labels_update_policy" ON custom_labels;
DROP POLICY IF EXISTS "custom_labels_delete_policy" ON custom_labels;

-- Create RLS policies
CREATE POLICY "custom_labels_select_policy" ON custom_labels
  FOR SELECT USING (true);

CREATE POLICY "custom_labels_insert_policy" ON custom_labels
  FOR INSERT WITH CHECK (true);

CREATE POLICY "custom_labels_update_policy" ON custom_labels
  FOR UPDATE USING (true);

CREATE POLICY "custom_labels_delete_policy" ON custom_labels
  FOR DELETE USING (true);
