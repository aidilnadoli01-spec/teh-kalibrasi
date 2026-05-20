import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { adminAuthOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // 1. Authorize Admin
    const session = await getServerSession(adminAuthOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access only.' },
        { status: 401 }
      );
    }

    // 2. Fetch inventory logs with joined details
    const logs = await query(`
      SELECT 
        il.id,
        il.product_id,
        il.user_id,
        il.order_id,
        il.change_type,
        il.quantity_changed,
        il.stock_before,
        il.stock_after,
        il.notes,
        il.created_at,
        p.name as product_name,
        u.name as user_name
      FROM inventory_logs il
      LEFT JOIN products p ON il.product_id = p.id
      LEFT JOIN users u ON il.user_id = u.id
      ORDER BY il.created_at DESC
    `);

    return NextResponse.json(Array.isArray(logs) ? logs : [], { status: 200 });
  } catch (error: any) {
    console.error('Error fetching inventory logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory logs' },
      { status: 500 }
    );
  }
}
