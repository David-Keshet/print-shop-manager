/**
 * Create Order via Server API
 */

async function createOrderViaAPI() {
  console.log('🔍 Creating Order via Server API');
  console.log('================================');
  
  // The invoice data we found
  const orderData = {
    order_number: `IC-2000`,
    customer_name: "משרד ראש הממשלה",
    customer_phone: "0523992300",
    customer_email: "print@dfus-keshet.com",
    total_with_vat: 1907.05,
    status: "חדש",
    icount_doc_number: "2000",
    icount_doc_type: "invoice",
    icount_client_id: "6",
    icount_date: "2026-01-14",
    icount_total: 1907.05,
    notes: "חשבונית מספר 2000 מ-iCount סונכרנה בהצלחה!"
  };
  
  try {
    console.log('📦 Creating order:', orderData);
    
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Order created successfully!');
      console.log('📄 Order Number:', result.data.order_number);
      console.log('👤 Customer:', result.data.customer_name);
      console.log('💰 Total:', result.data.total_with_vat);
      console.log('🆔 Order ID:', result.data.id);
      console.log('🔗 View in orders page: http://localhost:3000/orders');
      
      // Create order item
      const itemData = {
        order_id: result.data.id,
        description: "שירותי הדפסה ממשלתית",
        quantity: 1,
        unit_price: 1907.05,
        price: 1907.05,
        notes: "חשבונית מ-iCount"
      };
      
      console.log('📋 Creating order item:', itemData);
      
      const itemResponse = await fetch('http://localhost:3000/api/order-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData)
      });
      
      const itemResult = await itemResponse.json();
      
      if (itemResponse.ok && itemResult.success) {
        console.log('✅ Order item created successfully!');
        console.log('🎉 SUCCESS! Complete order created from iCount invoice');
      } else {
        console.log('❌ Error creating item:', itemResult);
      }
    } else {
      console.log('❌ Error creating order:', result);
    }
    
  } catch (error) {
    console.error('❌ General error:', error);
  }
}

createOrderViaAPI().catch(console.error);
