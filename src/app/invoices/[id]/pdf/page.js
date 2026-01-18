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
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>חשבונית PDF</title>
        <style>
          {`
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
            }
          `}
        </style>
      </head>
      <body>
        <InvoicePDFContent params={params} />
      </body>
    </html>
  )
}
