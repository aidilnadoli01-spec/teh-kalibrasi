import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendEmail, orderConfirmationTemplate } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchValue = searchParams.get('search');
    const searchType = searchParams.get('searchType');

    let orders;

    // If search parameters provided, search for single order
    if (searchValue && searchType) {
      if (searchType === 'id') {
        orders = await query(`
          SELECT * FROM orders WHERE id = ?
        `, [parseInt(searchValue, 10)]);
      } else if (searchType === 'email') {
        orders = await query(`
          SELECT * FROM orders WHERE customer_email = ?
        `, [searchValue]);
      }

      if (!Array.isArray(orders) || orders.length === 0) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      const order = (orders as any[])[0];
      const items = await query(`
        SELECT oi.product_id, oi.quantity, oi.price, p.name as product_name
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);

      return NextResponse.json(
        {
          ...order,
          items: Array.isArray(items) ? items : []
        },
        { status: 200 }
      );
    }

    // Fetch all orders (for admin)
    orders = await query(`
      SELECT * FROM orders
      ORDER BY created_at DESC
    `);
    
    const ordersArray = Array.isArray(orders) ? orders : [];
    
    // For each order, fetch its items
    const ordersWithItems = await Promise.all(
      ordersArray.map(async (order: any) => {
        const items = await query(`
          SELECT oi.product_id, oi.quantity, oi.price, p.name as product_name
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `, [order.id]);
        
        return {
          ...order,
          items: Array.isArray(items) ? items : []
        };
      })
    );
    
    return NextResponse.json(ordersWithItems, { status: 200 });
  } catch (error) {
    console.error('Error fetching orders:', error);
    // Return empty array instead of error to prevent frontend crash
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, customerPhone, customerAddress, items, totalPrice, paymentMethod } = body;

    // Validate input
    if (!customerName || !customerEmail || !items || !totalPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const method = paymentMethod || 'bank_transfer';

    // Fetch session to attach user_id if logged in
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to place an order.' },
        { status: 401 }
      );
    }
    const userId = (session.user as any).id;

    // Generate unique order number
    const orderNumber = `TK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Insert order
    const insertOrderResult = await query(
      `INSERT INTO orders (user_id, order_number, customer_name, customer_email, customer_phone, customer_address, subtotal, total_price, status, payment_method, payment_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'unpaid')`,
      [userId, orderNumber, customerName, customerEmail, customerPhone, customerAddress, totalPrice, totalPrice, method]
    );

    const orderId = (insertOrderResult as any).insertId;

    // Insert order items
    for (const item of items) {
      const itemSubtotal = item.price * item.quantity;
      await query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.quantity, item.price, itemSubtotal]
      );

      // Update product stock
      await query(
        `UPDATE products SET stock = stock - ? WHERE id = ?`,
        [item.quantity, item.productId]
      );
    }

    // Build email items from what was inserted
    const emailItems = items.map((item: any) => ({
      product_name: item.name || `Product #${item.productId}`,
      quantity: item.quantity,
      price: item.price,
    }));

    // Send order confirmation email (non-blocking)
    sendEmail({
      to: customerEmail,
      subject: `Order Confirmed #${orderId} - Tehkalibrasi`,
      html: orderConfirmationTemplate({
        id: orderId,
        customer_name: customerName,
        total_price: totalPrice,
        payment_method: method,
        items: emailItems,
      }),
    }).catch(err => console.error('[Email] Failed to send order confirmation:', err));

    return NextResponse.json(
      { message: 'Order created successfully', orderId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
