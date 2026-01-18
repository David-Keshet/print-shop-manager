'use client'

import { useState, useEffect } from 'react'
import { Save, RotateCw, Download } from 'lucide-react'

export default function InvoicePrintingSettings() {
  const [settings, setSettings] = useState({
    logoPosition: { x: 20, y: 20, width: 100, height: 100 },
    companyInfoPosition: { x: 150, y: 20, width: 300, height: 80 },
    invoiceNumberPosition: { x: 470, y: 20, width: 200, height: 80 },
    customerInfoPosition: { x: 20, y: 120, width: 350, height: 100 },
    itemsTablePosition: { x: 20, y: 230, width: 580, height: 200 },
    totalsPosition: { x: 400, y: 440, width: 200, height: 100 },
    paymentInfoPosition: { x: 20, y: 440, width: 200, height: 100 },
    signaturePosition: { x: 20, y: 540, width: 150, height: 80 },
    footerPosition: { x: 400, y: 540, width: 200, height: 80 }
  })

  const [selectedElement, setSelectedElement] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const elements = [
    { id: 'logo', name: 'לוגו', type: 'image', ...settings.logoPosition },
    { id: 'companyInfo', name: 'פרטי חברה', type: 'text', ...settings.companyInfoPosition },
    { id: 'invoiceNumber', name: 'פרטי חשבונית', type: 'text', ...settings.invoiceNumberPosition },
    { id: 'customerInfo', name: 'פרטי לקוח', type: 'text', ...settings.customerInfoPosition },
    { id: 'itemsTable', name: 'טבלת פריטים', type: 'table', ...settings.itemsTablePosition },
    { id: 'totals', name: 'סיכום', type: 'text', ...settings.totalsPosition },
    { id: 'paymentInfo', name: 'פרטי תשלום', type: 'text', ...settings.paymentInfoPosition },
    { id: 'signature', name: 'חתימה', type: 'image', ...settings.signaturePosition },
    { id: 'footer', name: 'כותרת דף', type: 'text', ...settings.footerPosition }
  ]

  const handleMouseDown = (e, elementId) => {
    setSelectedElement(elementId)
    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedElement) return

    const newX = Math.max(0, Math.min(600 - settings[selectedElement].width, e.clientX - dragOffset.x))
    const newY = Math.max(0, Math.min(700 - settings[selectedElement].height, e.clientY - dragOffset.y))

    setSettings(prev => ({
      ...prev,
      [selectedElement]: {
        ...prev[selectedElement],
        x: newX,
        y: newY
      }
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleSizeChange = (elementId, dimension, value) => {
    setSettings(prev => ({
      ...prev,
      [elementId]: {
        ...prev[elementId],
        [dimension]: Math.max(50, parseInt(value) || 50)
      }
    }))
  }

  const saveSettings = async () => {
    try {
      await fetch('/api/invoice-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      alert('הגדרות נשמרו בהצלחה!')
    } catch (error) {
      alert('שגיאה בשמירת הגדרות: ' + error.message)
    }
  }

  const resetToDefault = () => {
    setSettings({
      logoPosition: { x: 20, y: 20, width: 100, height: 100 },
      companyInfoPosition: { x: 150, y: 20, width: 300, height: 80 },
      invoiceNumberPosition: { x: 470, y: 20, width: 200, height: 80 },
      customerInfoPosition: { x: 20, y: 120, width: 350, height: 100 },
      itemsTablePosition: { x: 20, y: 230, width: 580, height: 200 },
      totalsPosition: { x: 400, y: 440, width: 200, height: 100 },
      paymentInfoPosition: { x: 20, y: 440, width: 200, height: 100 },
      signaturePosition: { x: 20, y: 540, width: 150, height: 80 },
      footerPosition: { x: 400, y: 540, width: 200, height: 80 }
    })
  }

  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e)
    const handleGlobalMouseUp = () => handleMouseUp()

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, selectedElement, dragOffset])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">הגדרות הדפסת חשבונית</h1>
            <div className="flex gap-4">
              <button
                onClick={resetToDefault}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                <RotateCw size={20} />
                איפוס
              </button>
              <button
                onClick={saveSettings}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save size={20} />
                שמור הגדרות
              </button>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              גרור את האלמנטים כדי לעצב את מיקום החשבונית. גרור אלמנט, החזק וגרור לשנות את הגודל כדי להזיז אותו.
            </p>
          </div>

          <div 
            className="relative bg-gray-100 border-2 border-gray-300 rounded-lg mx-auto"
            style={{ width: '650px', height: '650px' }}
          >
            {/* Grid background */}
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            {/* Elements */}
            {elements.map((element) => (
              <div
                key={element.id}
                className={`absolute border-2 cursor-move transition-colors ${
                  selectedElement === element.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-400 bg-white hover:border-gray-500'
                }`}
                style={{
                  left: `${element.x}px`,
                  top: `${element.y}px`,
                  width: `${element.width}px`,
                  height: `${element.height}px`
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
              >
                <div className="p-2 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-gray-700">
                      {element.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {element.width}×{element.height}
                    </span>
                  </div>
                  
                  {/* Size controls */}
                  <div className="flex gap-2 mt-auto">
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-gray-600">רוחב:</label>
                      <input
                        type="number"
                        value={element.width}
                        onChange={(e) => handleSizeChange(element.id, 'width', e.target.value)}
                        className="w-16 px-1 py-0 text-xs border rounded"
                        min="50"
                        max="300"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-gray-600">גובה:</label>
                      <input
                        type="number"
                        value={element.height}
                        onChange={(e) => handleSizeChange(element.id, 'height', e.target.value)}
                        className="w-16 px-1 py-0 text-xs border rounded"
                        min="50"
                        max="300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-blue-800">הוראות שימוש:</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• לחץ וגרור אלמנט כדי להזיז אותו</li>
              <li>• השתמש בעכבר העכבר כדי לשנות את הגודל</li>
              <li>• האלמנטים יישמרו אוטומטית ויושמו להפקת חשבוניות עתידיות</li>
              <li>• ניתן לאפס את הגדרות בכל עת כדי לחזור לעיצובים קבועים</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
