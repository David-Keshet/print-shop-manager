/**
 * iCount Sync Service
 * שירות לסנכרון נתונים בין iCount ל-Supabase
 */

import { createClient } from '@supabase/supabase-js'
import { getICountClient } from './client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

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
    this.iCountClient = getICountClient({
      cid: settings.cid,
      user: settings.user_name,
      pass: settings.encrypted_pass, // TODO: decrypt
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
        // ננסה כמה דרכים למשוך מסמכים

        // אופציה 1: חיפוש לפי תאריך (חודש אחרון)
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        const fromDate = lastMonth.toISOString().split('T')[0]

        const response = await this.iCountClient.request('doc/search', {
          from_date: fromDate,
          limit: 100,
          offset: 0
        })

        documents = response?.data || response || []
      } catch (apiError) {
        // אם doc/search לא עובד, נחזיר הודעה מפורטת
        console.error('❌ iCount API error:', apiError.message)
        return {
          synced: 0,
          created: 0,
          updated: 0,
          errors: 1,
          message: `Failed to fetch from iCount: ${apiError.message}. Try again in a few minutes if rate limited.`,
        }
      }

      console.log(`📦 Found ${documents.length} documents in iCount`)

      if (documents.length === 0) {
        return {
          synced: 0,
          created: 0,
          updated: 0,
          errors: 0,
          message: 'No documents found in iCount or unable to fetch them',
        }
      }

      // עבור על כל מסמך ויצור/עדכן חשבונית
      for (const doc of documents) {
        try {
          // בדוק אם החשבונית כבר קיימת (לפי icount_doc_id)
          const { data: existing } = await supabase
            .from('invoices')
            .select('id')
            .eq('icount_doc_id', doc.docid || doc.doc_id)
            .single()

          const invoiceData = {
            icount_doc_id: (doc.docid || doc.doc_id)?.toString(),
            invoice_number: doc.doc_num || doc.docnum,
            invoice_type: this.mapICountDocType(doc.type),
            issue_date: doc.date || new Date().toISOString().split('T')[0],
            total_amount: parseFloat(doc.amount || doc.total || 0),
            status: this.mapICountStatus(doc.status),
            sync_status: 'synced',
            synced_at: new Date().toISOString(),
            notes: doc.description || doc.remarks,
          }

          if (existing) {
            // עדכן
            await supabase
              .from('invoices')
              .update(invoiceData)
              .eq('id', existing.id)

            updated++
            console.log(`✅ Updated invoice ${invoiceData.invoice_number}`)
          } else {
            // צור חדש
            const { error: insertError } = await supabase
              .from('invoices')
              .insert(invoiceData)

            if (insertError) {
              console.error(`❌ Error creating invoice:`, insertError)
              errors++
            } else {
              created++
              console.log(`✅ Created invoice ${invoiceData.invoice_number}`)
            }
          }

          // רשום בלוג
          await this.logSync({
            entity_type: 'invoice',
            entity_id: existing?.id || 0,
            operation: existing ? 'update' : 'create',
            direction: 'from_icount',
            status: 'success',
            response_data: doc,
          })

        } catch (docError) {
          console.error(`❌ Error processing document:`, docError)
          errors++

          await this.logSync({
            entity_type: 'invoice',
            entity_id: 0,
            operation: 'sync',
            direction: 'from_icount',
            status: 'failed',
            error_message: docError.message,
          })
        }
      }

      return {
        synced: documents.length,
        created,
        updated,
        errors,
        message: `Synced ${created + updated} invoices (${created} new, ${updated} updated)`,
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
      await supabase.from('sync_log').insert({
        ...logEntry,
        attempted_at: new Date().toISOString(),
        completed_at: logEntry.status === 'success' ? new Date().toISOString() : null,
      })
    } catch (error) {
      console.error('Error logging sync:', error)
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
