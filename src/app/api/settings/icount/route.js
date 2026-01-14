import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

// מפתח להצפנה (בייצור צריך להיות ב-environment variable)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-char-secret-key-here!!'
const ALGORITHM = 'aes-256-cbc'

/**
 * הצפנת סיסמה
 */
function encrypt(text) {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    throw error
  }
}

/**
 * פענוח סיסמה
 */
function decrypt(text) {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const parts = text.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const encryptedText = parts[1]

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw error
  }
}

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
