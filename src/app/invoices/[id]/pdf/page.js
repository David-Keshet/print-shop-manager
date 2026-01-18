import { notFound } from 'next/navigation'
import InvoicePDF from '@/components/InvoicePDF'
import { getICountClient } from '@/lib/icount/client'

// Generate static params for dynamic routes
export async function generateStaticParams() {
  return []
}

// Server component to fetch data
async function InvoicePDFContent({ params }) {
  const { id } = await params
  
  // Always use mock data for now to ensure it works
  const mockInvoices = [
    {
      id: 1,
      invoice_number: '2000',
      customer_name: 'משרד ראש הממשלה',
      customer_id: 'CUST-001',
      customer_phone: '03-1234567',
      customer_email: 'office@pmo.gov.il',
      customer_address: 'רח\' הקפלן 3, ירושלים',
      invoice_type: 'invoice',
      status: 'open',
      issue_date: '2026-01-14',
      due_date: '2026-02-14',
      subtotal: 1616.14,
      vat_amount: 290.91,
      vat_rate: 18,
      total_with_vat: 1907.05,
      notes: 'תשלומים עבור שירותי הדפסה',
      items: [
        {
          id: 1,
          description: 'הדפסת חוברות פנימיות עם לוגו המשרד',
          quantity: 500,
          unit_price: 2,
          total: 1000
        },
        {
          id: 2,
          description: 'הדפסת מכתבי ראשי תיבות בנייר משובץ',
          quantity: 200,
          unit_price: 1.5,
          total: 300
        },
        {
          id: 3,
          description: 'הדפסת כרטיסי ביקור איכותיים עם ציפוי',
          quantity: 100,
          unit_price: 0.8,
          total: 80
        },
        {
          id: 4,
          description: 'הדפסת תיקיות לקבצים עם תוויות',
          quantity: 50,
          unit_price: 0.6,
          total: 30
        },
        {
          id: 5,
          description: 'הדפסת פוסטרים לכנס השנתי',
          quantity: 20,
          unit_price: 15,
          total: 300
        }
      ]
    },
    {
      id: 2,
      invoice_number: '2001',
      customer_name: 'עיריית תל אביב',
      customer_id: 'CUST-002',
      customer_phone: '03-9211111',
      customer_email: 'info@tel-aviv.gov.il',
      customer_address: 'רח\' איבן גבירול 69, תל אביב',
      invoice_type: 'invoice',
      status: 'paid',
      issue_date: '2024-01-20',
      due_date: '2024-02-20',
      subtotal: 2500,
      vat_amount: 450,
      vat_rate: 18,
      total_with_vat: 2950,
      notes: 'הדפסת כרזות וחוברות לעירייה',
      items: [
        {
          id: 1,
          description: 'הדפסת כרזות פרסומיות עבור עיריית תל אביב',
          quantity: 100,
          unit_price: 15,
          total: 1500
        },
        {
          id: 2,
          description: 'הדפסת חוברות דייריים למחלקת הביטחון',
          quantity: 200,
          unit_price: 5,
          total: 1000
        }
      ]
    },
    {
      id: 3,
      invoice_number: '2002',
      customer_name: 'בנק לאומי',
      customer_id: 'CUST-003',
      customer_phone: '03-6234234',
      customer_email: 'service@leumi.co.il',
      customer_address: 'רח\' הרצל 21, תל אביב',
      invoice_type: 'receipt',
      status: 'open',
      issue_date: '2024-01-25',
      due_date: '2024-02-25',
      subtotal: 800,
      vat_amount: 144,
      vat_rate: 18,
      total_with_vat: 944,
      notes: 'הדפסת טפסים ומסמכים פנימיים',
      items: [
        {
          id: 1,
          description: 'הדפסת טפסי הפקדה בנייר מיוחד',
          quantity: 1000,
          unit_price: 0.8,
          total: 800
        }
      ]
    }
  ]
  
  const invoiceId = parseInt(id)
  const invoice = mockInvoices.find(inv => inv.id === invoiceId)
  const items = invoice ? invoice.items : []

  if (!invoice) {
    console.log('❌ No invoice found for ID:', invoiceId)
    notFound()
  }

  console.log('✅ Using invoice:', invoice.customer_name)
  console.log('✅ Invoice data:', invoice)
  console.log('✅ Items data:', items)

  return <InvoicePDF invoice={invoice} items={items} standalone={true} />
}

export default InvoicePDFContent
