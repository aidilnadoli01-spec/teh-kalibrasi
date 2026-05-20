import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { adminAuthOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const results: any = await query('SELECT * FROM payment_methods WHERE id = ?', [id]);
    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    return NextResponse.json(results[0], { status: 200 });
  } catch (error: any) {
    console.error('Error fetching payment method:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin auth
    const session = await getServerSession(adminAuthOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { id } = await params;

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

    // First check if exists
    const existing: any = await query('SELECT id FROM payment_methods WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // Validation
    if (!type || !method_name) {
      return NextResponse.json({ error: 'Type and Method Name are required' }, { status: 400 });
    }

    const activeStatus = is_active !== undefined ? (is_active ? 1 : 0) : 1;

    await query(
      `UPDATE payment_methods
       SET type = ?, method_name = ?, account_name = ?, account_number = ?, qr_image = ?, logo = ?, description = ?, is_active = ?
       WHERE id = ?`,
      [
        type,
        method_name,
        account_name || null,
        account_number || null,
        qr_image || null,
        logo || null,
        description || null,
        activeStatus,
        id
      ]
    );

    return NextResponse.json({ message: 'Payment method updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating payment method:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin auth
    const session = await getServerSession(adminAuthOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { id } = await params;

    // First check if exists
    const existing: any = await query('SELECT id FROM payment_methods WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    await query('DELETE FROM payment_methods WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Payment method deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
