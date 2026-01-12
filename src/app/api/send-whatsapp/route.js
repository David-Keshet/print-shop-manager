import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { phone, message } = await request.json()

    // כרגע רק נדפיס את ההודעה (בהמשך נוסיף Twilio)
    console.log('📱 שליחת WhatsApp:')
    console.log('טלפון:', phone)
    console.log('הודעה:', message)

    // סימולציה של שליחה מוצלחת
    return NextResponse.json({
      success: true,
      message: 'הודעה נשלחה (סימולציה)'
    })

  } catch (error) {
    console.error('שגיאה בשליחת WhatsApp:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
