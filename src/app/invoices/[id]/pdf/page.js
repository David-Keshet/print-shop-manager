'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import InvoicePDF from '@/components/InvoicePDF'
import Layout from '@/components/Layout'

export default function InvoicePDFPage() {
  const params = useParams()
  const [invoice, setInvoice] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        // קבלת פרטי חשבונית
        const invoiceResponse = await fetch(`/api/invoices/${params.id}`)
        const invoiceData = await invoiceResponse.json()
        
        if (invoiceData.success) {
          setInvoice(invoiceData.invoice)
          setItems(invoiceData.items || [])
        }
      } catch (error) {
        console.error('Error fetching invoice:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchInvoice()
    }
  }, [params.id])

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-xl">טוען חשבונית...</div>
        </div>
      </Layout>
    )
  }

  if (!invoice) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-xl text-red-600">חשבונית לא נמצאה</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <InvoicePDF invoice={invoice} items={items} standalone={true} />
    </Layout>
  )
}
