import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Fetch wishlist joined with products
    const wishlist = await query(`
      SELECT w.id as wishlist_id, p.* 
      FROM wishlist w 
      JOIN products p ON w.product_id = p.id 
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [userId]);

    const wishlistArray = Array.isArray(wishlist) ? wishlist : [];
    
    return NextResponse.json(wishlistArray, { status: 200 });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    // Check if it already exists
    const existing: any = await query(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existing && existing.length > 0) {
      // It exists, so remove it (Toggle behavior)
      await query('DELETE FROM wishlist WHERE id = ?', [existing[0].id]);
      return NextResponse.json({ message: 'Removed from wishlist', action: 'removed' }, { status: 200 });
    } else {
      // It doesn't exist, so add it
      await query('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [userId, productId]);
      return NextResponse.json({ message: 'Added to wishlist', action: 'added' }, { status: 201 });
    }

  } catch (error) {
    console.error('Error modifying wishlist:', error);
    return NextResponse.json({ error: 'Failed to modify wishlist' }, { status: 500 });
  }
}
