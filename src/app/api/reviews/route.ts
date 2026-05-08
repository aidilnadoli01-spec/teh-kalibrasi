import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { userAuthOptions } from '@/lib/auth';

// GET reviews for a product
export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get('product_id');
    if (!productId) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    const reviews = await query(`
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [productId]);

    // Aggregate: avg rating & distribution
    const reviewsArr = Array.isArray(reviews) ? reviews : [];
    const avgRating = reviewsArr.length > 0
      ? reviewsArr.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsArr.length
      : 0;

    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviewsArr.filter((r: any) => r.rating === star).length,
    }));

    return NextResponse.json({
      reviews: reviewsArr,
      avgRating: parseFloat(avgRating.toFixed(1)),
      totalReviews: reviewsArr.length,
      distribution,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST a new review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(userAuthOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Kamu harus login untuk memberikan ulasan.' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const { product_id, rating, comment } = await request.json();

    // Validasi field wajib
    if (!product_id || !rating) {
      return NextResponse.json(
        { error: 'product_id dan rating wajib diisi.' },
        { status: 400 }
      );
    }
    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Komentar tidak boleh kosong.' },
        { status: 400 }
      );
    }
    if (comment.trim().length < 10) {
      return NextResponse.json(
        { error: 'Komentar minimal 10 karakter.' },
        { status: 400 }
      );
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating harus antara 1 dan 5.' },
        { status: 400 }
      );
    }

    // Cek apakah user sudah pernah review produk ini
    const existing: any = await query(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'Kamu sudah pernah memberikan ulasan untuk produk ini.' },
        { status: 400 }
      );
    }

    // Cek apakah user pernah membeli produk ini (order verified/delivered)
    const purchases: any = await query(`
      SELECT oi.id
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ?
        AND oi.product_id = ?
        AND o.status IN ('delivered', 'shipped', 'processing')
        AND o.payment_status = 'verified'
      LIMIT 1
    `, [userId, product_id]);

    if (!purchases || purchases.length === 0) {
      return NextResponse.json(
        { error: 'Kamu hanya bisa memberikan ulasan untuk produk yang sudah dibeli dan pembayarannya terverifikasi.' },
        { status: 403 }
      );
    }

    // Ambil order_id dari pembelian tersebut
    const orderItem: any = await query(`
      SELECT o.id as order_id
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ?
        AND oi.product_id = ?
        AND o.payment_status = 'verified'
      ORDER BY o.created_at DESC
      LIMIT 1
    `, [userId, product_id]);

    const orderId = orderItem && orderItem.length > 0 ? orderItem[0].order_id : null;

    await query(
      'INSERT INTO reviews (user_id, product_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [userId, product_id, orderId, rating, comment.trim()]
    );

    return NextResponse.json(
      { message: 'Ulasan berhasil dikirim. Terima kasih!' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Gagal mengirim ulasan. Coba lagi.' },
      { status: 500 }
    );
  }
}
