import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { adminAuthOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const connection = await getConnection();
  await connection.beginTransaction();

  try {
    const session = await getServerSession(adminAuthOptions);
    const userId = session?.user ? (session.user as any).id : null;

    const body = await request.json();
    const { name, description, price, image_url, stock, category_id } = body;

    if (!name || !price || stock === undefined) {
      await connection.rollback();
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [insertResult]: any = await connection.execute(
      `INSERT INTO products (name, description, price, image_url, stock, category_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description, price, image_url || null, stock, category_id || null]
    );

    const productId = insertResult.insertId;

    if (stock > 0) {
      await connection.execute(
        `INSERT INTO inventory_logs (product_id, user_id, order_id, change_type, quantity_changed, stock_before, stock_after, notes)
         VALUES (?, ?, NULL, 'restock', ?, 0, ?, ?)`,
        [productId, userId, stock, stock, `Initial product creation with stock ${stock}`]
      );
    }

    await connection.commit();

    return NextResponse.json(
      { message: 'Product created', id: productId },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  } finally {
    await connection.end();
  }
}

