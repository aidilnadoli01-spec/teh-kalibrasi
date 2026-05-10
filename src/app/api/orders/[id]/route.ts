import { NextRequest, NextResponse } from 'next/server';
import { query, getConnection } from '@/lib/db';
import {
  sendEmail,
  paymentVerifiedTemplate,
  orderReadyTemplate,
  orderCompletedTemplate,
} from '@/lib/email';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const orderId = resolvedParams.id;
    
    // Fetch order
    const orders: any[] = await query(`SELECT * FROM orders WHERE id = ?`, [orderId]) as any[];
    
    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    const order = (orders as any)[0];
    
    // Fetch order items
    const items = await query(`
      SELECT oi.product_id, oi.quantity, oi.price, p.name as product_name
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);
    
    order.items = Array.isArray(items) ? items : [];

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const orderId = resolvedParams.id;
    const body = await request.json();
    const { status, notes, payment_status, bank_name, bank_account_name, bank_account_number, customer_address } = body;

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // Update status if provided
    if (status) {
      const validStatuses = ['pending', 'processing', 'ready', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    // Update payment status if provided
    if (payment_status) {
      const validPaymentStatuses = ['unpaid', 'pending', 'verified'];
      if (!validPaymentStatuses.includes(payment_status)) {
        return NextResponse.json(
          { error: 'Invalid payment status' },
          { status: 400 }
        );
      }
      updateFields.push('payment_status = ?');
      updateValues.push(payment_status);
    }

    // Update notes if provided
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
    }

    // Update bank details if provided
    if (bank_name !== undefined) {
      updateFields.push('bank_name = ?');
      updateValues.push(bank_name);
    }
    if (bank_account_name !== undefined) {
      updateFields.push('bank_account_name = ?');
      updateValues.push(bank_account_name);
    }
    if (bank_account_number !== undefined) {
      updateFields.push('bank_account_number = ?');
      updateValues.push(bank_account_number);
    }
    if (customer_address !== undefined) {
      updateFields.push('customer_address = ?');
      updateValues.push(customer_address);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateValues.push(orderId);

    await query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // ==== Send Email Notifications based on what changed ====
    try {
      // Fetch full order details for email
      const orderRows: any = await query('SELECT * FROM orders WHERE id = ?', [orderId]);
      if (Array.isArray(orderRows) && orderRows.length > 0) {
        const order = orderRows[0];

        if (payment_status === 'verified') {
          sendEmail({
            to: order.customer_email,
            subject: `Pembayaran Dikonfirmasi - Order #${orderId} | Tehkalibrasi`,
            html: paymentVerifiedTemplate({
              id: order.id,
              customer_name: order.customer_name,
              total_price: order.total_price,
            }),
          }).catch(console.error);
        }

        if (status === 'ready') {
          sendEmail({
            to: order.customer_email,
            subject: `Pesanan Siap Diambil! - Order #${orderId} | Tehkalibrasi`,
            html: orderReadyTemplate({
              id: order.id,
              customer_name: order.customer_name,
            }),
          }).catch(console.error);
        }

        if (status === 'completed') {
          sendEmail({
            to: order.customer_email,
            subject: `Pesanan Selesai - Order #${orderId} | Tehkalibrasi`,
            html: orderCompletedTemplate({
              id: order.id,
              customer_name: order.customer_name,
            }),
          }).catch(console.error);
        }
      }
    } catch (emailErr) {
      console.error('[Email] Notification error (non-blocking):', emailErr);
    }
    // =======================================================

    return NextResponse.json(
      { message: 'Order updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const orderId = parseInt(id, 10);
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Get order items first to restore stock
    const orderItems = await query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [orderId]
    );

    // Restore product stock
    if (Array.isArray(orderItems) && orderItems.length > 0) {
      for (const item of orderItems as any[]) {
        if (item?.product_id && item?.quantity) {
          await query(
            'UPDATE products SET stock = stock + ? WHERE id = ?',
            [item.quantity, item.product_id]
          );
        }
      }
    }

    // Delete order (cascade will delete order_items)
    await query('DELETE FROM orders WHERE id = ?', [orderId]);

    // Reset auto-increment if all orders are deleted
    const remainingOrders = await query('SELECT COUNT(*) as count FROM orders') as any[];
    if (remainingOrders && remainingOrders.length > 0 && remainingOrders[0].count === 0) {
      // No orders left, reset auto-increment to 1
      const connection = await getConnection();
      try {
        await connection.query('ALTER TABLE orders AUTO_INCREMENT = 1');
      } finally {
        await connection.end();
      }
    }

    return NextResponse.json(
      { message: 'Order deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
