import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const isAdmin = userRole === 'admin';

    const resolvedParams = await Promise.resolve(params);
    const orderId = resolvedParams.id;
    
    // Validate order ownership
    const orders: any[] = await query(`SELECT user_id FROM orders WHERE id = ?`, [orderId]) as any[];
    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'Order tidak ditemukan.' }, { status: 404 });
    }
    
    const order = orders[0];
    if (!isAdmin && order.user_id !== userId) {
      return NextResponse.json(
        { error: 'Akses ditolak. Anda tidak berhak mengunggah bukti untuk pesanan ini.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { paymentProofUrl } = body;

    if (!paymentProofUrl) {
      return NextResponse.json(
        { error: 'Payment proof URL is required' },
        { status: 400 }
      );
    }

    // Update order with payment proof and set status to pending
    await query(
      `UPDATE orders SET payment_proof_url = ?, payment_status = 'pending' WHERE id = ?`,
      [paymentProofUrl, orderId]
    );

    return NextResponse.json(
      { message: 'Payment proof uploaded successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating payment proof:', error);
    return NextResponse.json(
      { error: 'Failed to update payment proof' },
      { status: 500 }
    );
  }
}
