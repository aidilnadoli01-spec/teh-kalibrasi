import { NextRequest, NextResponse } from 'next/server';
import { query, getConnection } from '@/lib/db';
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

  const connection = await getConnection();
  await connection.beginTransaction();

  try {
    // Generate unique order number
    const orderNumber = `TK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Insert order
    const [insertOrderResult]: any = await connection.execute(
      `INSERT INTO orders (user_id, order_number, customer_name, customer_email, customer_phone, customer_address, subtotal, total_price, status, payment_method, payment_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'unpaid')`,
      [userId, orderNumber, customerName, customerEmail, customerPhone, customerAddress, totalPrice, totalPrice, method]
    );

    const orderId = insertOrderResult.insertId;

    // Process and validate each item under row lock (FOR UPDATE)
    for (const item of items) {
      const [products]: any[] = await connection.execute(
        `SELECT name, stock FROM products WHERE id = ? FOR UPDATE`,
        [item.productId]
      );

      if (!products || products.length === 0) {
        throw new Error(`Produk dengan ID #${item.productId} tidak ditemukan.`);
      }

      const product = products[0];
      if (product.stock < item.quantity) {
        throw new Error(`Stok produk "${product.name}" tidak mencukupi. Tersedia: ${product.stock}, diminta: ${item.quantity}.`);
      }

      const stockBefore = product.stock;
      const stockAfter = product.stock - item.quantity;

      // Update product stock
      await connection.execute(
        `UPDATE products SET stock = ? WHERE id = ?`,
        [stockAfter, item.productId]
      );

      // Insert order items
      const itemSubtotal = item.price * item.quantity;
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.quantity, item.price, itemSubtotal]
      );

      // Insert inventory log
      await connection.execute(
        `INSERT INTO inventory_logs (product_id, user_id, order_id, change_type, quantity_changed, stock_before, stock_after, notes)
         VALUES (?, ?, ?, 'sale', ?, ?, ?, ?)`,
        [item.productId, userId, orderId, -item.quantity, stockBefore, stockAfter, `Order #${orderId} created by customer`]
      );
    }

    await connection.commit();

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
  } catch (error: any) {
    await connection.rollback();
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 400 } // Send 400 Bad Request for stock/validation errors so client can display it
    );
  } finally {
    await connection.end();
  }
}
