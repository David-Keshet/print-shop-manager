import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { encrypt, decrypt } from '@/lib/encryption'

/**
 * שמירת הגדרות iCount
 * POST /api/settings/icount
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { cid, user, pass, apiKey } = body

    // הצפן את הסיסמה
    const encryptedPass = pass ? encrypt(pass) : null

    // בדוק אם כבר קיימת הגדרה
    const { data: existing } = await supabase
      .from('icount_settings')
      .select('id')
      .limit(1)
      .single()

    let result
    if (existing) {
      // עדכן הגדרה קיימת
      const { data, error } = await supabase
        .from('icount_settings')
        .update({
          cid: cid || null,
          user_name: user,
          encrypted_pass: encryptedPass,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // צור הגדרה חדשה
      const { data, error } = await supabase
        .from('icount_settings')
        .insert({
          cid: cid || null,
          user_name: user,
          encrypted_pass: encryptedPass,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({
      success: true,
      message: 'ההגדרות נשמרו בהצלחה',
      settings: {
        id: result.id,
        cid: result.cid,
        user_name: result.user_name,
        is_active: result.is_active
      }
    })

  } catch (error) {
    console.error('Error saving iCount settings:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * קבלת הגדרות iCount
 * GET /api/settings/icount
 */
export async function GET(request) {
  try {
    const { data, error } = await supabase
      .from('icount_settings')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (error) {
      // אם אין הגדרות, החזר null
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          settings: null
        })
      }
      throw error
    }

    // פענח את הסיסמה
    let decryptedPass = null
    if (data.encrypted_pass) {
      try {
        decryptedPass = decrypt(data.encrypted_pass)
      } catch (decryptError) {
        console.error('Failed to decrypt password:', decryptError)
      }
    }

    return NextResponse.json({
      success: true,
      settings: {
        id: data.id,
        cid: data.cid,
        user_name: data.user_name,
        pass: decryptedPass, // החזר את הסיסמה המפוענחת (בזהירות!)
        is_active: data.is_active,
        last_sync: data.last_sync,
        sync_status: data.sync_status
      }
    })

  } catch (error) {
    console.error('Error fetching iCount settings:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
