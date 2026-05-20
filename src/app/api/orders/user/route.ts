import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function attachPaymentDetails(order: any) {
  if (!order) return order;
  if (order.payment_method_id) {
    const methods: any = await query(`SELECT * FROM payment_methods WHERE id = ?`, [order.payment_method_id]);
    if (Array.isArray(methods) && methods.length > 0) {
      order.payment_method_details = methods[0];
      return order;
    }
  }
  
  const typeMap: any = {
    'bank_transfer': 'bank_transfer',
    'ewallet': 'ewallet',
    'cod': 'cod'
  };
  const type = typeMap[order.payment_method] || 'bank_transfer';
  const methods: any = await query(`SELECT * FROM payment_methods WHERE type = ? AND is_active = 1 LIMIT 1`, [type]);
  if (Array.isArray(methods) && methods.length > 0) {
    order.payment_method_details = methods[0];
  } else {
    order.payment_method_details = null;
  }
  return order;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const orders = await query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const ordersArray = Array.isArray(orders) ? orders : [];
    
    const ordersWithItems = await Promise.all(
      ordersArray.map(async (order: any) => {
        await attachPaymentDetails(order);
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
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
