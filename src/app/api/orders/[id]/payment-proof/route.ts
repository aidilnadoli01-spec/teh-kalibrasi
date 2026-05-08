import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const orderId = resolvedParams.id;
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
