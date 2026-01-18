import { notFound } from 'next/navigation'
import InvoicePDF from '@/components/InvoicePDF'
import { invoiceService } from '@/lib/icount/invoiceService'

// Generate static params for dynamic routes
export async function generateStaticParams() {
  return []
}

// Server component to fetch data
async function InvoicePDFContent({ params }) {
  const { id } = await params
  
  let invoice, items
  
  try {
    invoice = await invoiceService.getInvoice(parseInt(id))
    items = await invoiceService.getInvoiceItems(parseInt(id))
  } catch (error) {
    console.error('Error fetching invoice:', error)
    notFound()
  }

  if (!invoice) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <InvoicePDF invoice={invoice} items={items || []} standalone={true} />
    </div>
  )
}

export default function InvoicePDFPage({ params }) {
  return (
    <div className="min-h-screen bg-white">
      <InvoicePDFContent {...params} />
    </div>
  )
}
