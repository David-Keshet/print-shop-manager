import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // Prefer SID/Token authentication (recommended by iCount)
    const sid = process.env.NEXT_PUBLIC_ICOUNT_SID
    const user = process.env.NEXT_PUBLIC_ICOUNT_USER
    const pass = process.env.NEXT_PUBLIC_ICOUNT_PASS
    const explicitCid = process.env.NEXT_PUBLIC_ICOUNT_CID

    const attempts = []

    // Check if we have SID (Token) - this is the recommended method
    if (sid) {
      // Method 1: Try with 'sid' parameter
      let companyData = null
      try {
        const companyResponse = await fetch('https://api.icount.co.il/api/v3.php/company', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sid: sid
          }),
        })
        companyData = await companyResponse.json()
        attempts.push({
          method: 'Company info with sid parameter',
          success: companyData.status !== false,
          data: companyData
        })
      } catch (error) {
        attempts.push({
          method: 'Company info with sid parameter',
          success: false,
          error: error.message
        })
      }

      // Method 2: Try with 'token' parameter if 'sid' failed
      if (!companyData || companyData.status === false) {
        try {
          const companyResponse2 = await fetch('https://api.icount.co.il/api/v3.php/company', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: sid
            }),
          })
          const companyData2 = await companyResponse2.json()
          attempts.push({
            method: 'Company info with token parameter',
            success: companyData2.status !== false,
            data: companyData2
          })
          if (companyData2.status !== false) {
            companyData = companyData2
          }
        } catch (error) {
          attempts.push({
            method: 'Company info with token parameter',
            success: false,
            error: error.message
          })
        }
      }

      // Method 3: Try with Authorization header
      if (!companyData || companyData.status === false) {
        try {
          const companyResponse3 = await fetch('https://api.icount.co.il/api/v3.php/company', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sid}`
            },
            body: JSON.stringify({}),
          })
          const companyData3 = await companyResponse3.json()
          attempts.push({
            method: 'Company info with Authorization header',
            success: companyData3.status !== false,
            data: companyData3
          })
          if (companyData3.status !== false) {
            companyData = companyData3
          }
        } catch (error) {
          attempts.push({
            method: 'Company info with Authorization header',
            success: false,
            error: error.message
          })
        }
      }

      // If SID authentication succeeded
      if (companyData && companyData.status !== false) {
        // Test accounting settings endpoint
        let accountingSettingsData = null
        try {
          const accountingResponse = await fetch('https://api.icount.co.il/api/v3.php/accounting_settings/get_sortcodes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sid: sid
            }),
          })
          accountingSettingsData = await accountingResponse.json()
          attempts.push({
            method: 'Accounting settings with SID token',
            success: accountingSettingsData.status !== false,
            data: accountingSettingsData
          })
        } catch (error) {
          attempts.push({
            method: 'Accounting settings with SID token',
            success: false,
            error: error.message
          })
        }

        // Test document list
        let documentsData = null
        try {
          const docsResponse = await fetch('https://api.icount.co.il/api/v3.php/doc/list', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sid: sid,
              limit: 5
            }),
          })
          documentsData = await docsResponse.json()
          attempts.push({
            method: 'Document list with SID token',
            success: documentsData.status !== false,
            data: documentsData
          })
        } catch (error) {
          attempts.push({
            method: 'Document list with SID token',
            success: false,
            error: error.message
          })
        }

        return NextResponse.json({
          success: true,
          message: '🎉 התחברות מוצלחת! חיבור ל-iCount עובד.',
          authMethod: 'SID/Token (recommended)',
          companyInfo: companyData,
          accountingSettings: accountingSettingsData,
          recentDocuments: documentsData,
          allAttempts: attempts
        })
      }

      // SID failed, try fallback to CID/User/Pass if available
      if (explicitCid && user && pass) {
        attempts.push({
          method: 'Fallback info',
          message: 'SID authentication failed, trying CID/User/Pass fallback'
        })
        // Continue to CID/User/Pass method below
      } else {
        return NextResponse.json({
          success: false,
          error: 'SID authentication failed and no CID/User/Pass available for fallback',
          details: companyData,
          allAttempts: attempts
        })
      }
    }

    // Fallback to legacy user/cid/pass authentication
    if (!user || !pass || !explicitCid) {
      return NextResponse.json({
        success: false,
        error: 'Missing credentials in environment variables',
        missing: {
          sid: !sid,
          cid: !explicitCid,
          user: !user,
          pass: !pass
        }
      })
    }

    // CID can be either a number or a string (like "printkeshet")
    const cid = isNaN(parseInt(explicitCid, 10)) ? explicitCid : parseInt(explicitCid, 10)

    // Try session-based login with CID/User/Pass
    let sessionId = null
    try {
      const loginResponse = await fetch('https://api.icount.co.il/api/v3.php/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cid: cid,
          user: user,
          pass: pass
        }),
      })

      const loginData = await loginResponse.json()
      attempts.push({
        method: 'Session login with CID/User/Pass',
        success: !!loginData.sid,
        data: loginData
      })

      if (loginData.sid) {
        sessionId = loginData.sid

        // Test accounting settings endpoint (more reliable than company endpoint)
        let accountingSettingsData = null
        try {
          const accountingResponse = await fetch('https://api.icount.co.il/api/v3.php/accounting_settings/get_sortcodes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sid: sessionId
            }),
          })
          accountingSettingsData = await accountingResponse.json()
          attempts.push({
            method: 'Accounting settings with session',
            success: accountingSettingsData.status !== false,
            data: accountingSettingsData
          })
        } catch (error) {
          attempts.push({
            method: 'Accounting settings with session',
            success: false,
            error: error.message
          })
        }

        // Test document list endpoint
        let documentsData = null
        try {
          const docsResponse = await fetch('https://api.icount.co.il/api/v3.php/doc/list', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sid: sessionId,
              limit: 5
            }),
          })
          documentsData = await docsResponse.json()
          attempts.push({
            method: 'Document list with session',
            success: documentsData.status !== false,
            data: documentsData
          })
        } catch (error) {
          attempts.push({
            method: 'Document list with session',
            success: false,
            error: error.message
          })
        }

        // If we got a valid session, we're authenticated!
        return NextResponse.json({
          success: true,
          message: '🎉 התחברות מוצלחת! חיבור ל-iCount עובד.',
          authMethod: 'Session-based (CID/User/Pass login)',
          sessionId: '***OBTAINED***',
          userInfo: loginData.user_info,
          accountingSettings: accountingSettingsData,
          recentDocuments: documentsData,
          allAttempts: attempts,
          cidUsed: cid
        })
      }
    } catch (error) {
      attempts.push({
        method: 'Session login',
        success: false,
        error: error.message
      })
    }

    // If we got here, all methods failed
    return NextResponse.json({
      success: false,
      error: 'All authentication methods failed',
      allAttempts: attempts,
      cidUsed: cid
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
