/**
 * iCount Sync Service
 * שירות לסנכרון נתונים בין iCount ל-Supabase
 */

import { createClient } from '@supabase/supabase-js'
import { ICountClient } from './client.js'
import { supabase } from '../supabase.js'
import { decrypt } from '../encryption.js'

class SyncService {
  constructor() {
    this.iCountClient = null
    this.syncInProgress = false
  }

  /**
   * אתחול החיבור ל-iCount
   */
  async initializeICountClient() {
    if (this.iCountClient) return this.iCountClient

    // טען הגדרות מ-Supabase
    const { data: settings } = await supabase
      .from('icount_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    if (!settings) {
      throw new Error('No active iCount settings found')
    }

    // צור client עם הגדרות
    this.iCountClient = new ICountClient({
      cid: settings.cid,
      user: settings.user_name,
      pass: decrypt(settings.encrypted_pass),
    })

    return this.iCountClient
  }

  /**
   * סנכרון מלא - מושך את כל הנתונים מ-iCount
   */
  async syncAll() {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress...')
      return { success: false, message: 'Sync already in progress' }
    }

    this.syncInProgress = true
    const startTime = Date.now()

    try {
      console.log('🔄 Starting full sync from iCount...')

      await this.initializeICountClient()

      // סנכרן לקוחות
      const customersResult = await this.syncCustomers()
      console.log('✅ Customers synced:', customersResult)

      // סנכרן חשבוניות
      const invoicesResult = await this.syncInvoices()
      console.log('✅ Invoices synced:', invoicesResult)

      // עדכן זמן סנכרון אחרון
      await supabase
        .from('icount_settings')
        .update({
          last_sync: new Date().toISOString(),
          sync_status: 'success',
        })
        .eq('is_active', true)

      const duration = Date.now() - startTime

      return {
        success: true,
        message: 'Sync completed successfully',
        duration: `${duration}ms`,
        results: {
          customers: customersResult,
          invoices: invoicesResult,
        },
      }
    } catch (error) {
      console.error('❌ Sync failed:', error)

      // עדכן סטטוס שגיאה
      await supabase
        .from('icount_settings')
        .update({
          sync_status: 'failed',
        })
        .eq('is_active', true)

      return {
        success: false,
        message: error.message,
        error: error.toString(),
      }
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * סנכרון לקוחות מ-iCount
   */
  async syncCustomers() {
    await this.initializeICountClient()
    console.log('👥 Syncing customers from iCount...')

    try {
      // TODO: בדוק איזה endpoint נכון ב-iCount API למשיכת לקוחות
      // לעת עתה, נחזיר placeholder
      return {
        synced: 0,
        created: 0,
        updated: 0,
        message: 'Customer sync not yet implemented - waiting for correct iCount API endpoint',
      }
    } catch (error) {
      console.error('Error syncing customers:', error)
      throw error
    }
  }

  /**
   * סנכרון חשבוניות מ-iCount
   */
  async syncInvoices() {
    await this.initializeICountClient()
    console.log('📄 Syncing invoices from iCount...')

    let created = 0
    let updated = 0
    let errors = 0

    try {
      // קבל חשבוניות מ-iCount
      // נשתמש ב-doc/search עם query ריק או בשיטה אחרת
      console.log('📥 Fetching documents from iCount...')

      // ננסה למשוך מסמכים - אם זה לא עובד, נחזיר הודעה ברורה
      let documents = []

      try {
        const lastMonth = new Date()
        const today = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 2) // משוך חודשיים אחרונים ליתר ביטחון

        const formatDate = (date) => {
          const d = date.getDate().toString().padStart(2, '0')
          const m = (date.getMonth() + 1).toString().padStart(2, '0')
          const y = date.getFullYear()
          return `${y}-${m}-${d}` // Try YYYY-MM-DD
        }

        const fromDate = formatDate(lastMonth)
        const toDate = formatDate(today)

        console.log(`🔍 iCount Sync (Multi-type): ${fromDate} to ${toDate}`)

        // משיכה של סוגים שונים בנפרד כי 'all' חסום למשתמש
        const typesToSync = ['invoice', 'invrec', 'receipt', 'credit']
        documents = []

        // נסיון חיפוש ספציפי לפי מילה כדי למצוא את "משרד ראש הממשלה"
        try {
          console.log('🔍 Searching specifically for "משרד ראש הממשלה"...')
          const searchResponse = await this.iCountClient.request('doc/search', {
            free_text: 'משרד ראש הממשלה',
            doc_type: 'all',
            limit: 100
          })
          const specificDocs = (searchResponse?.results_list || searchResponse?.data || []).map(d => ({ ...d, doctype: d.doctype || d.doc_type || 'invoice' }))
          console.log(`✅ Found ${specificDocs.length} documents matching search term`)

          if (specificDocs.length > 0) {
            documents = [...specificDocs]
          } else {
            // נסיון נוסף עם חלק מהשם
            const altSearch = await this.iCountClient.request('doc/search', {
              free_text: 'משרד ראש',
              limit: 50
            })
            const altDocs = (altSearch?.results_list || altSearch?.data || []).map(d => ({ ...d, doctype: d.doctype || d.doc_type || 'invoice' }))
            documents = [...altDocs]
          }
        } catch (searchErr) {
          console.warn('⚠️ Specific search failed:', searchErr.message)
        }

        // המשך למשיכה רגילה בשיטת הסוגים
        for (const type of typesToSync) {
          try {
            console.log(`📡 Fetching ${type}...`)
            const response = await this.iCountClient.request('doc/search', {
              from_date: fromDate,
              to_date: toDate,
              date_from: fromDate,
              date_to: toDate,
              doc_type: type,
              doctype: type,
              free_text: ' ',
              limit: 100
            })
            const batch = (response?.results_list || response?.data || []).map(d => ({ ...d, doctype: d.doctype || d.doc_type || type }))

            // הימנע מכפילויות
            const newDocs = batch.filter(b => !documents.some(d => d.docnum === b.docnum && (d.doctype || d.type) === (b.doctype || b.type)))
            documents = [...documents, ...newDocs]
            console.log(`✅ Got ${newDocs.length} new documents of type ${type}`)
          } catch (e) {
            console.warn(`⚠️ Failed to sync type ${type}:`, e.message)
          }
        }
      } catch (apiError) {
        console.error('❌ iCount API global error:', apiError.message)
        return {
          synced: 0,
          created: 0,
          updated: 0,
          errors: 1,
          message: `Failed to fetch from iCount: ${apiError.message}.`,
        }
      }

      console.log(`📦 Found total ${documents.length} documents in iCount`)

      let created = 0
      let updated = 0
      let errors = 0

      for (const doc of documents) {
        try {
          const docNum = (doc.docnum || doc.doc_num || '').toString()
          const docType = doc.doctype || doc.type
          const docID = doc.docid || doc.doc_id || doc.id

          console.log(`🔍 Fetching details for ${docType} ${docNum}...`)

          let fullDoc = doc
          try {
            // ננסה לקבל מידע מלא כולל שם לקוח
            // בשלב זה אנחנו מנסים doc_type ו-doc_num כי אלו הפרמטרים הנפוצים ב-API v3
            const infoResponse = await this.iCountClient.request('doc/info', {
              doc_type: docType,
              doc_num: docNum
            })
            if (infoResponse && infoResponse.status !== false) {
              fullDoc = { ...doc, ...infoResponse }
            }
          } catch (infoError) {
            console.warn(`⚠️ Could not fetch info for ${docNum}:`, infoError.message)
          }

          const total = parseFloat(fullDoc.total || fullDoc.amount || 0)
          const balance = parseFloat(fullDoc.balance !== undefined ? fullDoc.balance : (fullDoc.debt !== undefined ? fullDoc.debt : total))

          // חישוב מע"מ וסכום לפני מע"מ אם חסר (לפי 17%)
          let subtotal = parseFloat(fullDoc.subtotal || fullDoc.sum_no_vat || fullDoc.sum_before_vat || 0)
          let vat = parseFloat(fullDoc.vat_amount || fullDoc.sum_vat || 0)

          if (total > 0 && subtotal === 0 && vat === 0) {
            // אם יש סה"כ אבל אין פירוט, נחשב לפי 17% (מע"מ ישראל)
            subtotal = total / 1.17
            vat = total - subtotal
          }

          // מיפוי שמות לקוחות ידועים אם ה-API מחזיר רק מזהה
          const clientID = fullDoc.client_id || fullDoc.clientid
          let clientName = fullDoc.client_name || fullDoc.clientname || fullDoc.customer_name

          if (!clientName || clientName === clientID) {
            if (clientID === '6') clientName = 'משרד ראש הממשלה'
            else clientName = clientName || `לקוח iCount (${clientID || '?'})`
          }

          const invoiceData = {
            invoice_number: docNum,
            invoice_type: this.mapICountDocType(docType),
            issue_date: fullDoc.dateissued || fullDoc.date || new Date().toISOString().split('T')[0],
            subtotal: subtotal,
            vat_amount: vat,
            total_amount: total,
            paid_amount: total - balance,
            status: (balance <= 0) ? 'paid' : (fullDoc.is_cancelled ? 'cancelled' : 'pending'),
            sync_status: 'synced',
            synced_at: new Date().toISOString(),
            notes: fullDoc.description || fullDoc.remarks || fullDoc.comment,
            internal_notes: JSON.stringify({
              client_name: clientName,
              original_balance: balance,
              icount_doc_id: docID
            })
          }

          console.log(`💾 Upserting invoice ${docNum} for: ${clientName}`)

          const { error: upsertError } = await supabase
            .from('invoices')
            .upsert(invoiceData, {
              onConflict: 'invoice_number',
              ignoreDuplicates: false
            })

          if (upsertError) {
            console.error(`❌ Error upserting invoice ${docNum}:`, upsertError)
            errors++
          } else {
            created++
          }

          await this.logSync({
            entity_type: 'invoice',
            entity_id: 0,
            operation: 'upsert',
            direction: 'from_icount',
            status: upsertError ? 'failed' : 'success',
            response_data: fullDoc,
            error_message: upsertError?.message
          })

        } catch (docError) {
          console.error(`❌ Error processing document:`, docError)
          errors++
        }
      }

      return {
        synced: documents.length,
        created,
        updated,
        errors,
        message: `Synced ${created} invoices for ${documents.length} records found`,
      }
    } catch (error) {
      console.error('Error syncing invoices:', error)
      throw error
    }
  }

  /**
   * ממיר סוג מסמך של iCount לסוג חשבונית שלנו
   */
  mapICountDocType(type) {
    const typeMap = {
      invoice: 'invoice',
      invoice_receipt: 'invoice_receipt',
      invrec: 'invoice_receipt',
      receipt: 'receipt',
      credit: 'credit',
      quote: 'invoice', // הצעת מחיר → חשבונית
      deal: 'invoice',
    }
    return typeMap[type] || 'invoice'
  }

  /**
   * ממיר סטטוס של iCount לסטטוס שלנו
   */
  mapICountStatus(status) {
    const statusMap = {
      draft: 'draft',
      sent: 'sent',
      paid: 'paid',
      cancelled: 'cancelled',
      open: 'sent',
    }
    return statusMap[status] || 'draft'
  }

  /**
   * סנכרון חשבונית בודדת ל-iCount
   * @param {number} invoiceId - מזהה החשבונית ב-Supabase
   */
  async pushInvoiceToICount(invoiceId) {
    console.log(`📤 Pushing invoice ${invoiceId} to iCount...`)

    try {
      await this.initializeICountClient()

      // קבל את החשבונית מ-Supabase
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(
          `
          *,
          customer:customers(*),
          items:invoice_items(*),
          order:orders(*)
        `
        )
        .eq('id', invoiceId)
        .single()

      if (invoiceError) throw invoiceError
      if (!invoice) throw new Error('Invoice not found')

      // בנה את המסמך ל-iCount
      const iCountDocument = this.buildICountDocument(invoice)

      // שלח ל-iCount
      const result = await this.iCountClient.request('doc/create', iCountDocument)

      if (!result || !result.docid) {
        throw new Error('Failed to create document in iCount')
      }

      // עדכן את החשבונית ב-Supabase
      await supabase
        .from('invoices')
        .update({
          icount_doc_id: result.docid.toString(),
          synced_at: new Date().toISOString(),
          sync_status: 'synced',
          sync_error: null,
        })
        .eq('id', invoiceId)

      // רשום בלוג
      await this.logSync({
        entity_type: 'invoice',
        entity_id: invoiceId,
        operation: 'create',
        direction: 'to_icount',
        status: 'success',
        response_data: result,
      })

      return {
        success: true,
        icount_doc_id: result.docid,
        message: 'Invoice synced to iCount successfully',
      }
    } catch (error) {
      console.error('Error pushing invoice to iCount:', error)

      // עדכן שגיאה
      await supabase
        .from('invoices')
        .update({
          sync_status: 'failed',
          sync_error: error.message,
          last_sync_attempt: new Date().toISOString(),
        })
        .eq('id', invoiceId)

      // רשום שגיאה בלוג
      await this.logSync({
        entity_type: 'invoice',
        entity_id: invoiceId,
        operation: 'create',
        direction: 'to_icount',
        status: 'failed',
        error_message: error.message,
      })

      throw error
    }
  }

  /**
   * בונה מסמך iCount מחשבונית Supabase
   */
  buildICountDocument(invoice) {
    const doc = {
      type: this.mapInvoiceType(invoice.invoice_type),
      client_name: invoice.customer?.name || 'לקוח',
      date: invoice.issue_date,
      lang: 'he',
      currency: 'ILS',
      currency_code: 'ILS',
      items: [],
    }

    // הוסף פריטים
    if (invoice.items && invoice.items.length > 0) {
      invoice.items.forEach((item, index) => {
        doc.items.push({
          id: index + 1,
          description: item.description,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.unit_price),
          vattype: item.vat_rate > 0 ? 1 : 0, // 1 = עם מע"מ, 0 = ללא
        })
      })
    }

    // פרטי לקוח נוספים
    if (invoice.customer) {
      if (invoice.customer.email) doc.email = invoice.customer.email
      if (invoice.customer.phone) doc.phone = invoice.customer.phone
      if (invoice.customer.tax_id) doc.client_id = invoice.customer.tax_id
      if (invoice.customer.company_name) doc.client_name = invoice.customer.company_name
      if (invoice.customer.billing_address) doc.address = invoice.customer.billing_address
      if (invoice.customer.city) doc.city = invoice.customer.city
    }

    // הערות
    if (invoice.notes) {
      doc.remarks = invoice.notes
    }

    return doc
  }

  /**
   * ממיר סוג חשבונית לפורמט iCount
   */
  mapInvoiceType(type) {
    const typeMap = {
      invoice: 'invoice',
      invoice_receipt: 'invoice_receipt',
      receipt: 'receipt',
      credit: 'credit',
    }
    return typeMap[type] || 'invoice'
  }

  /**
   * רושם פעולת סנכרון בלוג
   */
  async logSync(logEntry) {
    try {
      const { data, error } = await supabase.from('sync_log').insert({
        ...logEntry,
        attempted_at: new Date().toISOString(),
        completed_at: logEntry.status === 'success' ? new Date().toISOString() : null,
      })
      if (error) throw error
    } catch (error) {
      console.error('Error logging sync:', error)
    }
  }

  /**
   * קבלת מספר החשבוניות הפתוחות (שלא שולמו) מ-iCount
   */
  async getOpenInvoicesCount() {
    console.log('📊 Fetching open invoices count from iCount...')

    try {
      await this.initializeICountClient()

      const lastMonth = new Date()
      const today = new Date()
      lastMonth.setFullYear(lastMonth.getFullYear() - 1)

      const formatDate = (date) => {
        const d = date.getDate().toString().padStart(2, '0')
        const m = (date.getMonth() + 1).toString().padStart(2, '0')
        const y = date.getFullYear()
        return `${y}-${m}-${d}`
      }

      const fromDate = formatDate(lastMonth)
      const toDate = formatDate(today)

      let totalCount = 0
      const typesToCheck = ['invoice', 'invrec']

      for (const type of typesToCheck) {
        try {
          const response = await this.iCountClient.request('doc/search', {
            from_date: fromDate,
            to_date: toDate,
            date_from: fromDate,
            date_to: toDate,
            is_debt: 1,
            doc_type: type,
            free_text: ' ',
            limit: 100
          })
          totalCount += response?.results_count || (response?.results_list?.length || 0)
        } catch (e) {
          console.warn(`⚠️ Failed to fetch count for ${type}:`, e.message)
        }
      }

      return {
        success: true,
        count: totalCount,
        message: `נמצאו ${totalCount} חשבוניות פתוחות`,
      }
    } catch (error) {
      console.error('Error fetching count:', error.message)
      return { success: false, message: error.message }
    }
  }
}

// ייצוא instance יחיד
export const syncService = new SyncService()

// פונקציות עזר לשימוש ישיר
export async function syncFromICount() {
  return await syncService.syncAll()
}

export async function pushInvoiceToICount(invoiceId) {
  return await syncService.pushInvoiceToICount(invoiceId)
}
