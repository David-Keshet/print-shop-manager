/**
 * Invoice Service
 * שירות לניהול חשבוניות עם תמיכה ב-iCount ומצב אופליין
 */

import { supabase } from '@/lib/supabase'
import { getICountClient } from './client'
import { DOCUMENT_TYPES, DOCUMENT_STATUS } from './config'

export class InvoiceService {
  constructor() {
    this.icountClient = getICountClient()
  }

  /**
   * יצירת חשבונית מהזמנה
   */
  async createInvoiceFromOrder(orderId, invoiceType = DOCUMENT_TYPES.INVOICE) {
    try {
      // 1. שלוף את פרטי ההזמנה
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            id, name, email, phone, tax_id, company_name,
            billing_address, city, postal_code
          )
        `)
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError
      if (!order) throw new Error('Order not found')

      // 2. חשב סכומים
      const subtotal = parseFloat(order.total_before_vat || 0)
      const vatAmount = parseFloat(order.vat_amount || 0)
      const totalAmount = parseFloat(order.total_with_vat || 0)

      // 3. צור חשבונית במסד הנתונים המקומי
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          order_id: orderId,
          customer_id: order.customer_id,
          invoice_type: invoiceType,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: this.calculateDueDate(30), // 30 ימים כברירת מחדל
          subtotal: subtotal,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          paid_amount: 0,
          status: 'draft',
          payment_status: 'unpaid',
          sync_status: 'pending'
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // 4. צור פריטים לחשבונית
      await this.createInvoiceItems(invoice.id, order)

      // 5. נסה לסנכרן עם iCount (אם יש חיבור)
      await this.syncToICount(invoice.id)

      // 6. עדכן הזמנה שחשבונית נוצרה
      await supabase
        .from('orders')
        .update({
          invoiced: true
        })
        .eq('id', orderId)

      return { success: true, invoice }

    } catch (error) {
      console.error('Error creating invoice:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * יצירת פריטים לחשבונית מההזמנה
   */
  async createInvoiceItems(invoiceId, order) {
    const items = []

    // הוסף את הפריט הראשי (ההדפסה)
    items.push({
      invoice_id: invoiceId,
      description: order.description || 'עבודת דפוס',
      quantity: order.quantity || 1,
      unit_price: parseFloat(order.total_before_vat || 0),
      vat_rate: 17,
      vat_amount: parseFloat(order.vat_amount || 0),
      total: parseFloat(order.total_with_vat || 0),
      line_number: 1
    })

    const { error } = await supabase
      .from('invoice_items')
      .insert(items)

    if (error) throw error
  }

  /**
   * חישוב תאריך תשלום
   */
  calculateDueDate(daysFromNow = 30) {
    const date = new Date()
    date.setDate(date.getDate() + daysFromNow)
    return date.toISOString().split('T')[0]
  }

  /**
   * סנכרון חשבונית ל-iCount
   */
  async syncToICount(invoiceId) {
    try {
      // שלוף את פרטי החשבונית
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (*),
          invoice_items (*)
        `)
        .eq('id', invoiceId)
        .single()

      if (error) throw error

      // אם כבר מסונכרן, דלג
      if (invoice.icount_doc_id && invoice.sync_status === 'synced') {
        return { success: true, message: 'Already synced' }
      }

      // בנה את המסמך ל-iCount
      const icountDocument = this.buildICountDocument(invoice)

      // נסה לשלוח ל-iCount
      let icountResponse
      try {
        if (invoice.icount_doc_id) {
          // עדכון מסמך קיים
          icountResponse = await this.icountClient.updateDocument(
            invoice.icount_doc_id,
            icountDocument
          )
        } else {
          // יצירת מסמך חדש
          icountResponse = await this.icountClient.createDocument(icountDocument)
        }

        // עדכן את הסטטוס במסד הנתונים
        await supabase
          .from('invoices')
          .update({
            icount_doc_id: icountResponse.docid || icountResponse.doc_id,
            invoice_number: icountResponse.doc_num || invoice.invoice_number,
            sync_status: 'synced',
            synced_at: new Date().toISOString(),
            status: 'sent'
          })
          .eq('id', invoiceId)

        // רשום בלוג
        await this.logSync({
          entity_type: 'invoice',
          entity_id: invoiceId,
          operation: invoice.icount_doc_id ? 'update' : 'create',
          direction: 'to_icount',
          status: 'success',
          response_data: icountResponse
        })

        return { success: true, icountResponse }

      } catch (icountError) {
        // אם נכשל, עדכן סטטוס
        if (icountError.message === 'OFFLINE_MODE') {
          await supabase
            .from('invoices')
            .update({
              sync_status: 'pending',
              last_sync_attempt: new Date().toISOString()
            })
            .eq('id', invoiceId)

          return { success: false, offline: true }
        }

        // שגיאה אחרת
        await supabase
          .from('invoices')
          .update({
            sync_status: 'failed',
            sync_error: icountError.message,
            last_sync_attempt: new Date().toISOString()
          })
          .eq('id', invoiceId)

        await this.logSync({
          entity_type: 'invoice',
          entity_id: invoiceId,
          operation: invoice.icount_doc_id ? 'update' : 'create',
          direction: 'to_icount',
          status: 'failed',
          error_message: icountError.message
        })

        throw icountError
      }

    } catch (error) {
      console.error('Sync to iCount failed:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * בניית מסמך לפורמט של iCount
   * תמיכה בכל סוגי המסמכים: חשבוניות, קבלות, זיכויים וכו'
   */
  buildICountDocument(invoice) {
    const customer = invoice.customers

    // קביעת סוג המסמך ב-iCount בהתאם לסוג המסמך המקומי
    const getICountDocumentType = (localType) => {
      const typeMapping = {
        'invoice': 'invoice',                    // חשבונית מס
        'invoice_receipt': 'invoice_receipt',    // חשבונית מס קבלה
        'receipt': 'receipt',                    // קבלה
        'credit': 'credit',                      // חשבונית זיכוי
        'quote': 'quote',                        // הצעת מחיר
        'delivery_note': 'delivery_note',        // תעודת משלוח
        'return': 'return',                      // החזרה
        'purchase': 'purchase'                   // חשבונית קניה
      }
      return typeMapping[localType] || 'invoice'
    }

    return {
      type: getICountDocumentType(invoice.invoice_type),
      lang: 'he',
      currency: 'ILS',

      // פרטי לקוח
      client_name: customer.company_name || customer.name,
      client_email: customer.email,
      client_phone: customer.phone,
      client_address: customer.billing_address,
      client_city: customer.city,
      client_zip: customer.postal_code,
      client_taxid: customer.tax_id,

      // תאריכים
      date: invoice.issue_date,
      due_date: invoice.due_date,

      // פריטים
      items: invoice.invoice_items.map((item, index) => ({
        description: item.description,
        quantity: parseFloat(item.quantity),
        price: parseFloat(item.unit_price),
        amount: parseFloat(item.total),
        vat: parseFloat(item.vat_rate),
      })),

      // הערות
      remarks: invoice.notes,

      // הגדרות נוספות בהתאם לסוג המסמך
      income: ['invoice', 'invoice_receipt', 'receipt'].includes(invoice.invoice_type), // מסמכי הכנסה
      vat_type: 0, // כולל מע"מ
    }
  }

  /**
   * רישום בלוג סנכרון
   */
  async logSync(logData) {
    await supabase.from('sync_log').insert({
      ...logData,
      completed_at: new Date().toISOString()
    })
  }

  /**
   * קבלת רשימת חשבוניות/מסמכים
   * תמיכה בסינון לפי סוג מסמך (document type)
   */
  async getInvoices(filters = {}) {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        customers (id, name, email, phone),
        orders (order_number)
      `)
      .order('created_at', { ascending: false })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id)
    }

    if (filters.payment_status) {
      query = query.eq('payment_status', filters.payment_status)
    }

    // סנן לפי סוג מסמך (document type)
    if (filters.invoice_type) {
      query = query.eq('invoice_type', filters.invoice_type)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  /**
   * קבלת חשבונית ספציפית
   */
  async getInvoice(invoiceId) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (*),
        orders (order_number),
        invoice_items (*),
        invoice_payments (*)
      `)
      .eq('id', invoiceId)
      .single()

    if (error) throw error
    return data
  }

  /**
   * עדכון חשבונית
   */
  async updateInvoice(invoiceId, updates) {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        ...updates,
        sync_status: 'pending' // סמן לסנכרון מחדש
      })
      .eq('id', invoiceId)
      .select()
      .single()

    if (error) throw error

    // נסה לסנכרן
    await this.syncToICount(invoiceId)

    return data
  }

  /**
   * ביטול חשבונית
   */
  async cancelInvoice(invoiceId, reason = '') {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'cancelled',
        internal_notes: reason
      })
      .eq('id', invoiceId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * רישום תשלום
   */
  async recordPayment(invoiceId, paymentData) {
    // 1. הוסף תשלום
    const { data: payment, error: paymentError } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: invoiceId,
        ...paymentData
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // 2. חשב סכום ששולם עד כה
    const { data: payments } = await supabase
      .from('invoice_payments')
      .select('amount')
      .eq('invoice_id', invoiceId)

    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)

    // 3. עדכן את החשבונית
    const { data: invoice } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('id', invoiceId)
      .single()

    const paymentStatus =
      totalPaid >= parseFloat(invoice.total_amount)
        ? 'paid'
        : totalPaid > 0
        ? 'partially_paid'
        : 'unpaid'

    await supabase
      .from('invoices')
      .update({
        paid_amount: totalPaid,
        payment_status: paymentStatus,
        payment_date: paymentStatus === 'paid' ? new Date().toISOString().split('T')[0] : null,
        sync_status: 'pending'
      })
      .eq('id', invoiceId)

    // 4. סנכרן ל-iCount
    await this.syncToICount(invoiceId)

    return payment
  }

  /**
   * סנכרון כל החשבוניות הממתינות
   */
  async syncPendingInvoices() {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id')
      .eq('sync_status', 'pending')

    if (error) throw error

    const results = []
    for (const invoice of invoices) {
      const result = await this.syncToICount(invoice.id)
      results.push({ invoice_id: invoice.id, result })
    }

    return results
  }
}

// יצירת instance גלובלי
export const invoiceService = new InvoiceService()