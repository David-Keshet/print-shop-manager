/**
 * API Route: Create Invoice in iCount
 * יוצר חשבונית חדשה ב-iCount ושומר ב-Supabase
 */

import { NextResponse } from 'next/server'
import { syncService } from '@/lib/icount/syncService'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const { customer_name, items, order_id, notes } = body

    if (!customer_name || !items || items.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'נא לספק שם לקוח ופריטים'
      }, { status: 400 })
    }

    console.log('📄 Creating invoice for:', customer_name)

    // אתחול ה-client
    await syncService.initializeICountClient()

    // בניית המסמך
    const doc = {
      doctype: 'invrec', // חשבונית מס קבלה
      client_name: customer_name,
      lang: 'he',
      currency_code: 'ILS',
      items: items.map((item, index) => ({
        description: item.description || 'שירותי דפוס',
        quantity: item.quantity || 1,
        unitprice: item.vat_included
          ? parseFloat(item.price) / 1.18  // אם כולל מע"מ, הפחת
          : parseFloat(item.price),
        vattype: 1 // עם מע"מ
      }))
    }

    // אם יש הערות
    if (notes) {
      doc.remarks = notes
    }

    console.log('📤 Sending to iCount:', JSON.stringify(doc, null, 2))

    // שליחה ל-iCount
    const result = await syncService.iCountClient.request('doc/create', doc)

    console.log('📥 iCount response:', result)

    if (!result || result.status === false) {
      throw new Error(result?.reason || result?.message || 'Failed to create invoice in iCount')
    }

    const invoiceNumber = result.docnum || result.doc_num || result.docid

    // חישוב סכומים
    let subtotal = 0
    items.forEach(item => {
      const price = item.vat_included
        ? parseFloat(item.price) / 1.18
        : parseFloat(item.price)
      subtotal += price * (item.quantity || 1)
    })
    const vatAmount = subtotal * 0.18
    const totalAmount = subtotal + vatAmount

    // שמירה ב-Supabase
    const invoiceData = {
      invoice_number: invoiceNumber?.toString(),
      invoice_type: 'invoice_receipt',
      issue_date: new Date().toISOString().split('T')[0],
      subtotal: subtotal,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      paid_amount: totalAmount, // חשבונית מס קבלה = שולם
      status: 'paid',
      sync_status: 'synced',
      synced_at: new Date().toISOString(),
      order_id: order_id || null,
      notes: notes || null,
      internal_notes: JSON.stringify({
        client_name: customer_name,
        icount_doc_id: result.docid,
        created_from: 'manual'
      })
    }

    const { data: savedInvoice, error: saveError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single()

    if (saveError) {
      console.error('Error saving invoice to Supabase:', saveError)
      // החשבונית נוצרה ב-iCount אבל לא נשמרה - נחזיר הצלחה חלקית
      return NextResponse.json({
        success: true,
        partial: true,
        invoice_number: invoiceNumber,
        message: 'חשבונית נוצרה ב-iCount אך לא נשמרה במערכת המקומית',
        icount_response: result
      })
    }

    // שמירת פריטי החשבונית
    if (savedInvoice && items.length > 0) {
      const invoiceItems = items.map((item, index) => ({
        invoice_id: savedInvoice.id,
        description: item.description || 'שירותי דפוס',
        quantity: item.quantity || 1,
        unit_price: item.vat_included
          ? parseFloat(item.price) / 1.18
          : parseFloat(item.price),
        vat_rate: 18,
        vat_amount: (item.vat_included
          ? parseFloat(item.price) / 1.18
          : parseFloat(item.price)) * 0.18 * (item.quantity || 1),
        total: parseFloat(item.price) * (item.quantity || 1),
        line_number: index + 1
      }))

      await supabase.from('invoice_items').insert(invoiceItems)
    }

    console.log('✅ Invoice created successfully:', invoiceNumber)

    return NextResponse.json({
      success: true,
      invoice_number: invoiceNumber,
      invoice_id: savedInvoice.id,
      message: `חשבונית מספר ${invoiceNumber} נוצרה בהצלחה`
    })

  } catch (error) {
    console.error('❌ Error creating invoice:', error)

    return NextResponse.json({
      success: false,
      message: error.message || 'שגיאה ביצירת חשבונית',
      error: error.toString()
    }, { status: 500 })
  }
}
