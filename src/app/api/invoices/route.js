import { NextResponse } from 'next/server'

// קבלת רשימת חשבוניות זמנית
const mockInvoices = [
  {
    id: 1,
    order_id: 1,
    customer_id: 6,
    customer_name: 'משרד ראש הממשלה',
    invoice_type: 'invoice',
    invoice_number: '2000',
    issue_date: '2026-01-14',
    due_date: '2026-02-13',
    subtotal: 1629.87,
    vat_amount: 277.18,
    total_with_vat: 1907.05,
    status: 'open',
    notes: 'חשבונית מספר 2000 מ-iCount',
    created_at: new Date().toISOString()
  }
];

// קבלת רשימת לקוחות זמנית
const mockCustomers = [
  {
    id: 6,
    name: 'משרד ראש הממשלה',
    email: 'print@dfus-keshet.com',
    phone: '0523992300',
    tax_id: '123456789',
    company_name: 'משרד ראש הממשלה',
    billing_address: 'קפריסמן, ירושלים',
    city: 'ירושלים',
    postal_code: '9190500'
  }
];

// קבלת רשימת הזמנות זמנית
const mockOrders = [
  {
    id: 1,
    order_number: 'IC-2000',
    customer_id: 6,
    customer_name: 'משרד ראש הממשלה',
    customer_phone: '0523992300',
    customer_email: 'print@dfus-keshet.com',
    total_with_vat: 1907.05,
    status: 'חדש',
    icount_doc_number: '2000',
    icount_doc_type: 'invoice',
    icount_client_id: '6',
    icount_date: '2026-01-14',
    icount_total: 1907.05,
    notes: 'חשבונית מספר 2000 מ-iCount סונכרנה בהצלחה!',
    created_at: new Date().toISOString()
  }
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    // החזר פילטרים
    let filteredInvoices = [...mockInvoices];
    
    if (searchParams.get('status')) {
      const status = searchParams.get('status');
      filteredInvoices = filteredInvoices.filter(inv => inv.status === status);
    }
    
    if (searchParams.get('customer_id')) {
      const customerId = parseInt(searchParams.get('customer_id'));
      filteredInvoices = filteredInvoices.filter(inv => inv.customer_id === customerId);
    }
    
    if (searchParams.get('payment_status')) {
      const paymentStatus = searchParams.get('payment_status');
      filteredInvoices = filteredInvoices.filter(inv => inv.payment_status === paymentStatus);
    }

    return NextResponse.json({ 
      success: true, 
      invoices: filteredInvoices 
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { order_id, invoice_type, sync_to_icount } = body

    if (!order_id) {
      return NextResponse.json(
        { success: false, error: 'order_id is required' },
        { status: 400 }
      )
    }

    // מצא את ההזמנה
    const order = mockOrders.find(o => o.id === order_id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // מצא את הלקוח
    const customer = mockCustomers.find(c => c.id === order.customer_id);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // צור חשבונית חדשה
    const newInvoice = {
      id: mockInvoices.length + 1,
      order_id: order_id,
      customer_id: order.customer_id,
      customer_name: customer.name,
      invoice_type: invoice_type || 'invoice',
      invoice_number: `INV-${Date.now()}`,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: order.total_with_vat / 1.17,
      vat_amount: order.total_with_vat - (order.total_with_vat / 1.17),
      total_with_vat: order.total_with_vat,
      status: 'open',
      notes: `חשבונית מהזמנה ${order.order_number}`,
      created_at: new Date().toISOString()
    };

    console.log('✅ Invoice created:', newInvoice);

    return NextResponse.json({
      success: true,
      invoice: newInvoice,
      message: 'Invoice created successfully'
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
