import { NextResponse } from 'next/server'

// Default settings
const defaultSettings = {
  logoPosition: { x: 20, y: 20, width: 100, height: 100 },
  companyInfoPosition: { x: 150, y: 20, width: 300, height: 80 },
  invoiceNumberPosition: { x: 470, y: 20, width: 200, height: 80 },
  customerInfoPosition: { x: 20, y: 120, width: 350, height: 100 },
  itemsTablePosition: { x: 20, y: 230, width: 580, height: 200 },
  totalsPosition: { x: 400, y: 440, width: 200, height: 100 },
  paymentInfoPosition: { x: 20, y: 440, width: 200, height: 100 },
  signaturePosition: { x: 20, y: 540, width: 150, height: 80 },
  footerPosition: { x: 400, y: 540, width: 200, height: 80 }
}

// In-memory storage (in production, use a database)
let storedSettings = { ...defaultSettings }

export async function GET() {
  return NextResponse.json(storedSettings)
}

export async function POST(request) {
  try {
    const settings = await request.json()
    
    // Validate settings
    const validatedSettings = {}
    
    Object.keys(defaultSettings).forEach(key => {
      const setting = settings[key] || defaultSettings[key]
      validatedSettings[key] = {
        x: Math.max(0, Math.min(600, parseInt(setting.x) || 0)),
        y: Math.max(0, Math.min(700, parseInt(setting.y) || 0)),
        width: Math.max(50, Math.min(300, parseInt(setting.width) || 50)),
        height: Math.max(50, Math.min(300, parseInt(setting.height) || 50))
      }
    })
    
    // Store settings (in production, save to database)
    storedSettings = validatedSettings
    
    return NextResponse.json({ 
      success: true, 
      message: 'Settings saved successfully',
      settings: validatedSettings 
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid settings format' 
      },
      { status: 400 }
    )
  }
}
