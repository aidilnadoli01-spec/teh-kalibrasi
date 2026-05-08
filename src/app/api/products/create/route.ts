import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, image_url, stock, category_id } = body;

    if (!name || !price || stock === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO products (name, description, price, image_url, stock, category_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description, price, image_url || null, stock, category_id || null]
    );

    return NextResponse.json(
      { message: 'Product created', id: (result as any).insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
