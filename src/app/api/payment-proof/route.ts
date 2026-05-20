import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from '@/lib/db';
import { put } from '@vercel/blob';
export async function POST(request: NextRequest) {
  try {
    // 1. Session Auth Validation
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Silakan login terlebih dahulu.' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const isAdmin = userRole === 'admin';

    // 2. Extract Multipart Form Data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const orderIdStr = formData.get('orderId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!orderIdStr) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const orderId = parseInt(orderIdStr, 10);
    
    // 3. Validate order ownership
    const orders: any[] = await query(`SELECT user_id, status FROM orders WHERE id = ?`, [orderId]) as any[];
    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'Order tidak ditemukan.' }, { status: 404 });
    }

    const order = orders[0];
    if (!isAdmin && String(order.user_id) !== String(userId)) {
      return NextResponse.json({ error: 'Akses ditolak. Anda tidak berhak mengunggah bukti untuk pesanan ini.' }, { status: 403 });
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
        return NextResponse.json({ error: `Tidak bisa upload bukti pembayaran untuk pesanan dengan status ${order.status}` }, { status: 400 });
    }

    // 4. Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!file.type || !allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Hanya file JPEG, PNG, WebP, dan GIF yang diizinkan' },
        { status: 400 }
      );
    }

    // 5. Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Ukuran file tidak boleh lebih dari 5MB' },
        { status: 400 }
      );
    }

    // 6. Check for Vercel Blob Token
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('Vercel Blob token missing.');
      return NextResponse.json({ error: 'Sistem penyimpanan cloud belum dikonfigurasi. Hubungi Admin.' }, { status: 500 });
    }

    // 7. Upload to Vercel Blob
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `payment-proof-${orderId}-${timestamp}.${extension}`;
    const storagePath = `payment-proofs/${userId}/${filename}`; // Folder based on userId

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let blob;
    try {
      blob = await put(storagePath, buffer, {
        access: 'public',
        contentType: file.type,
      });
    } catch (uploadError: any) {
      console.error('Vercel Blob upload error:', uploadError);
      return NextResponse.json({ error: 'Gagal mengunggah file ke cloud storage: ' + uploadError.message }, { status: 500 });
    }

    const imagePath = blob.url;

    // 8. Update database
    await query(
      `UPDATE orders SET payment_proof_url = ?, payment_status = 'pending', payment_uploaded_at = NOW() WHERE id = ?`,
      [imagePath, orderId]
    );

    return NextResponse.json(
      { message: 'Payment proof uploaded successfully', imagePath },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error uploading payment proof:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload payment proof' },
      { status: 500 }
    );
  }
}
