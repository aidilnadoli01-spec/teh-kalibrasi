import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { adminAuthOptions } from "@/lib/auth";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') + '-' + Date.now();
}

export async function POST(request: NextRequest) {
  const connection = await getConnection();
  await connection.beginTransaction();

  try {
    const session = await getServerSession(adminAuthOptions);
    const userId = session?.user ? ((session.user as any).id || null) : null;

    const body = await request.json();
    const { name, description, price, image_url, stock, category_id } = body;

    // Validate inputs
    if (!name || typeof name !== 'string' || name.trim() === '') {
      await connection.rollback();
      return NextResponse.json(
        { error: 'Nama produk wajib diisi' },
        { status: 400 }
      );
    }

    if (price === undefined || typeof price !== 'number' || isNaN(price) || price < 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: 'Harga produk tidak valid atau tidak boleh bernilai negatif' },
        { status: 400 }
      );
    }

    if (stock === undefined || typeof stock !== 'number' || isNaN(stock) || stock < 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: 'Stok produk tidak valid atau tidak boleh bernilai negatif' },
        { status: 400 }
      );
    }

    if (category_id !== undefined && category_id !== null) {
      if (typeof category_id !== 'number' || isNaN(category_id) || category_id <= 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'Kategori tidak valid' },
          { status: 400 }
        );
      }
      // Check if category exists
      const [cats]: any[] = await connection.execute(
        `SELECT id FROM categories WHERE id = ?`,
        [category_id]
      );
      if (!cats || cats.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'Kategori tidak ditemukan' },
          { status: 400 }
        );
      }
    }

    const slug = generateSlug(name);

    const [insertResult]: any = await connection.execute(
      `INSERT INTO products (name, slug, description, price, image_url, stock, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description || '', price, image_url || null, stock, category_id || null]
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
  } catch (error: any) {
    await connection.rollback();
    console.error('Error creating product:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create product',
        details: error?.message || String(error),
        code: error?.code
      },
      { status: 500 }
    );
  } finally {
    await connection.end();
  }
}
