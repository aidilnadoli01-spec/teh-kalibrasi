import { NextRequest, NextResponse } from 'next/server';
import { query, getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions, adminAuthOptions } from "@/lib/auth";
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
    let session = await getServerSession(authOptions);
    let isAdmin = false;

    if (session?.user && (session.user as any).role === 'admin') {
      isAdmin = true;
    } else {
      const adminSession = await getServerSession(adminAuthOptions);
      if (adminSession?.user && (adminSession.user as any).role === 'admin') {
        session = adminSession;
        isAdmin = true;
      }
    }

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    const resolvedParams = await Promise.resolve(params);
    const orderId = resolvedParams.id;
    
    // Fetch order
    const orders: any[] = await query(`SELECT * FROM orders WHERE id = ?`, [orderId]) as any[];
    
    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: 'Order tidak ditemukan' },
        { status: 404 }
      );
    }
    
    const order = (orders as any)[0];

    // Auth check: Regular user can only view their own orders
    if (!isAdmin && String(order.user_id) !== String(userId)) {
      return NextResponse.json(
        { error: 'Akses ditolak. Anda tidak memiliki izin untuk mengakses pesanan ini.' },
        { status: 403 }
      );
    }

    // Fetch payment method details
    if (order.payment_method_id) {
      const pm: any = await query(`SELECT * FROM payment_methods WHERE id = ?`, [order.payment_method_id]);
      order.payment_method_details = pm && pm.length > 0 ? pm[0] : null;
    } else {
      const typeMap: any = {
        'bank_transfer': 'bank_transfer',
        'ewallet': 'ewallet',
        'cod': 'cod'
      };
      const type = typeMap[order.payment_method] || 'bank_transfer';
      const pm: any = await query(`SELECT * FROM payment_methods WHERE type = ? AND is_active = 1 LIMIT 1`, [type]);
      order.payment_method_details = pm && pm.length > 0 ? pm[0] : null;
    }
    
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
    const session = await getServerSession(adminAuthOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const orderId = resolvedParams.id;
    const body = await request.json();
    const { status, notes, payment_status, bank_name, bank_account_name, bank_account_number, customer_address } = body;

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
    // 1. Fetch old order details to verify status changes under row lock
    const [oldOrders]: any[] = await connection.execute(
      `SELECT status, user_id FROM orders WHERE id = ? FOR UPDATE`,
      [orderId]
    );

    if (!oldOrders || oldOrders.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const oldOrder = oldOrders[0];
    const oldStatus = oldOrder.status;

    // 2. Check if status is transitioning to/from cancelled to modify stock
    if (status && status !== oldStatus) {
      const validStatuses = ['pending', 'processing', 'ready', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        await connection.rollback();
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      const [orderItems]: any[] = await connection.execute(
        `SELECT product_id, quantity FROM order_items WHERE order_id = ?`,
        [orderId]
      );

      if (status === 'cancelled' && oldStatus !== 'cancelled') {
        // Restoring stock (Order is cancelled)
        for (const item of orderItems) {
          const [products]: any[] = await connection.execute(
            `SELECT name, stock FROM products WHERE id = ? FOR UPDATE`,
            [item.product_id]
          );

          if (products && products.length > 0) {
            const product = products[0];
            const stockBefore = product.stock;
            const stockAfter = product.stock + item.quantity;

            await connection.execute(
              `UPDATE products SET stock = ? WHERE id = ?`,
              [stockAfter, item.product_id]
            );

            await connection.execute(
              `INSERT INTO inventory_logs (product_id, user_id, order_id, change_type, quantity_changed, stock_before, stock_after, notes)
               VALUES (?, ?, ?, 'cancellation', ?, ?, ?, ?)`,
              [item.product_id, oldOrder.user_id, orderId, item.quantity, stockBefore, stockAfter, `Order #${orderId} cancelled by admin`]
            );
          }
        }
      } else if (oldStatus === 'cancelled' && status !== 'cancelled') {
        // Reducing stock (Re-activating a cancelled order)
        for (const item of orderItems) {
          const [products]: any[] = await connection.execute(
            `SELECT name, stock FROM products WHERE id = ? FOR UPDATE`,
            [item.product_id]
          );

          if (!products || products.length === 0) {
            throw new Error(`Produk dengan ID #${item.product_id} tidak ditemukan.`);
          }

          const product = products[0];
          if (product.stock < item.quantity) {
            throw new Error(`Stok produk "${product.name}" tidak mencukupi untuk mengaktifkan kembali pesanan. Tersedia: ${product.stock}, diminta: ${item.quantity}.`);
          }

          const stockBefore = product.stock;
          const stockAfter = product.stock - item.quantity;

          await connection.execute(
            `UPDATE products SET stock = ? WHERE id = ?`,
            [stockAfter, item.product_id]
          );

          await connection.execute(
            `INSERT INTO inventory_logs (product_id, user_id, order_id, change_type, quantity_changed, stock_before, stock_after, notes)
             VALUES (?, ?, ?, 'sale', ?, ?, ?, ?)`,
            [item.product_id, oldOrder.user_id, orderId, -item.quantity, stockBefore, stockAfter, `Order #${orderId} reactivated by admin`]
          );
        }
      }
    }

    // 3. Construct updates
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (payment_status) {
      const validPaymentStatuses = ['unpaid', 'pending', 'verified'];
      if (!validPaymentStatuses.includes(payment_status)) {
        await connection.rollback();
        return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
      }
      updateFields.push('payment_status = ?');
      updateValues.push(payment_status);

      if (payment_status === 'verified') {
        updateFields.push('payment_verified_at = NOW()');
        updateFields.push('payment_verified_by = ?');
        updateValues.push((session.user as any).id);
      }
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
    }
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

    if (updateFields.length > 0) {
      updateValues.push(orderId);
      await connection.execute(
        `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    await connection.commit();

    // ==== Send Email Notifications based on what changed (Non-blocking) ====
    try {
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

    return NextResponse.json(
      { message: 'Order updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    await connection.rollback();
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 400 }
    );
  } finally {
    await connection.end();
  }
  } catch (error: any) {
    console.error('Outer error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(adminAuthOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

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

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // 1. Fetch order details to check its current status & user_id
      const [orders]: any[] = await connection.execute(
        `SELECT status, user_id FROM orders WHERE id = ? FOR UPDATE`,
        [orderId]
      );

      if (!orders || orders.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const order = orders[0];

      // 2. Restore stock ONLY if order status is NOT 'cancelled'
      if (order.status !== 'cancelled') {
        const [orderItems]: any[] = await connection.execute(
          'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
          [orderId]
        );

        if (orderItems && orderItems.length > 0) {
          for (const item of orderItems) {
            const [products]: any[] = await connection.execute(
              `SELECT name, stock FROM products WHERE id = ? FOR UPDATE`,
              [item.product_id]
            );

            if (products && products.length > 0) {
              const product = products[0];
              const stockBefore = product.stock;
              const stockAfter = product.stock + item.quantity;

              // Restore stock
              await connection.execute(
                `UPDATE products SET stock = ? WHERE id = ?`,
                [stockAfter, item.product_id]
              );

              // Log inventory change
              await connection.execute(
                `INSERT INTO inventory_logs (product_id, user_id, order_id, change_type, quantity_changed, stock_before, stock_after, notes)
                 VALUES (?, ?, ?, 'cancellation', ?, ?, ?, ?)`,
                [item.product_id, order.user_id, orderId, item.quantity, stockBefore, stockAfter, `Stock restored due to Order #${orderId} deletion`]
              );
            }
          }
        }
      }

      // 3. Delete order (cascade will delete order_items)
      await connection.execute('DELETE FROM orders WHERE id = ?', [orderId]);

      await connection.commit();
    } catch (txErr: any) {
      await connection.rollback();
      throw txErr;
    } finally {
      await connection.end();
    }

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
  } catch (error: any) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete order' },
      { status: 500 }
    );
  }
}
