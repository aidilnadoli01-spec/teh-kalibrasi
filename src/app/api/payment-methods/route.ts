import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { adminAuthOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') === 'true';

    let sql = 'SELECT * FROM payment_methods';
    const params: any[] = [];

    if (activeOnly) {
      sql += ' WHERE is_active = 1';
    }

    sql += ' ORDER BY id ASC';

    const results = await query(sql, params);
    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession(adminAuthOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      method_name,
      account_name,
      account_number,
      qr_image,
      logo,
      description,
      is_active
    } = body;

    // Validation
    if (!type || !method_name) {
      return NextResponse.json({ error: 'Type and Method Name are required' }, { status: 400 });
    }

    const activeStatus = is_active !== undefined ? (is_active ? 1 : 0) : 1;

    const result: any = await query(
      `INSERT INTO payment_methods (type, method_name, account_name, account_number, qr_image, logo, description, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        type,
        method_name,
        account_name || null,
        account_number || null,
        qr_image || null,
        logo || null,
        description || null,
        activeStatus
      ]
    );

    return NextResponse.json(
      {
        message: 'Payment method created successfully',
        id: result.insertId
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating payment method:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
