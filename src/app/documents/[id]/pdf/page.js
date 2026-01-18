'use client'

import { useState, useEffect } from 'react'
import InvoicePDF from '@/components/InvoicePDF'
import { useParams } from 'next/navigation'
import Layout from '@/components/Layout'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function DocumentPDFPage() {
    const params = useParams()
    const [document, setDocument] = useState(null)
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch(`/api/invoices/${params.id}`)
                const data = await response.json()

                if (data.success) {
                    setDocument(data.invoice)
                    setItems(data.items || [])
                } else {
                    setError(data.error || 'נכשלה טעינת המסמך')
                }
            } catch (err) {
                console.error('Error fetching document for PDF:', err)
                setError('שגיאת תקשורת בטעינת המסמך')
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchData()
        }
    }, [params.id])

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1117]">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                    <p className="text-gray-400 font-bold tracking-widest text-xs uppercase">מכין תצוגה מקדימה...</p>
                </div>
            </Layout>
        )
    }

    if (error) {
        return (
            <Layout>
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1117] p-4 text-center">
                    <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-6 font-bold text-2xl">!</div>
                    <h2 className="text-2xl font-black text-white mb-2">שגיאה בטעינת המסמך</h2>
                    <p className="text-gray-400 mb-8 max-w-sm">{error}</p>
                    <Link href="/documents">
                        <button className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-bold transition-all border border-gray-700">
                            חזרה למסמכים
                        </button>
                    </Link>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="min-h-screen bg-[#0f1117] p-6">
                <div className="max-w-[210mm] mx-auto">
                    <div className="flex justify-between items-center mb-6 no-print">
                        <Link href={`/documents/${params.id}`}>
                            <button className="flex items-center gap-2 text-gray-400 hover:text-white font-bold transition-colors bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700">
                                <ArrowLeft size={20} />
                                חזרה לפרטי המסמך
                            </button>
                        </Link>

                        <h1 className="text-xl font-black text-white">תצוגה מקדימה להדפסה</h1>

                        <div className="w-[150px]"></div> {/* Spacer for symmetry */}
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-white/10">
                        <InvoicePDF invoice={document} items={items} standalone={true} />
                    </div>
                </div>
            </div>
        </Layout>
    )
}
