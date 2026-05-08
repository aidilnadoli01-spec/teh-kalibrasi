import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 });
    }

    const promos: any = await query(`
      SELECT * FROM promo_codes 
      WHERE code = ? AND is_active = 1 
      AND (expiry_date IS NULL OR expiry_date >= CURDATE())
    `, [code]);

    if (!promos || promos.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired promo code' }, { status: 404 });
    }

    const promo = promos[0];

    return NextResponse.json({
      code: promo.code,
      discount_percentage: promo.discount_percentage,
      max_discount: promo.max_discount
    }, { status: 200 });

  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json({ error: 'Failed to validate promo code' }, { status: 500 });
  }
}
