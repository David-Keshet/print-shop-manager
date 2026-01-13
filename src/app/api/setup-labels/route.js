import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // Test if table exists
    const { data: existingTable, error: tableError } = await supabase
      .from('custom_labels')
      .select('count')
      .limit(1)

    if (tableError) {
      console.log('Table does not exist, creating...')
      
      // Create table
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS custom_labels (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL DEFAULT 'bg-blue-500',
            position INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
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
        `
      })
      
      if (createError) {
        return NextResponse.json({ error: 'Failed to create table', details: createError }, { status: 500 })
      }
    }

    // Test fetch
    const { data: labels, error: fetchError } = await supabase
      .from('custom_labels')
      .select('*')
      .order('position')

    return NextResponse.json({ 
      success: true, 
      labels: labels || [],
      tableError: tableError?.message,
      fetchError: fetchError?.message 
    })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
