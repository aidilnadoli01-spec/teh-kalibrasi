import { NextRequest, NextResponse } from 'next/server';
import { query, getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { adminAuthOptions } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await request.json();
    const { name, description, price, image_url, stock, category_id } = body;

    const session = await getServerSession(adminAuthOptions);
    const userId = session?.user ? ((session.user as any).id || null) : null;

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // 1. Fetch old product details for comparison
      const [products]: any[] = await connection.execute(
        `SELECT name, stock FROM products WHERE id = ? FOR UPDATE`,
        [productId]
      );

      if (!products || products.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      const oldProduct = products[0];
      const oldStock = oldProduct.stock;

      const updateFields = [];
      const updateValues = [];

      if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      if (category_id !== undefined) {
        updateFields.push('category_id = ?');
        updateValues.push(category_id);
      }
      if (price !== undefined) {
        updateFields.push('price = ?');
        updateValues.push(price);
      }
      if (image_url !== undefined) {
        updateFields.push('image_url = ?');
        updateValues.push(image_url);
      }
      if (stock !== undefined) {
        updateFields.push('stock = ?');
        updateValues.push(stock);
      }

      if (updateFields.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'No fields to update' },
          { status: 400 }
        );
      }

      updateValues.push(productId);

      // Perform update
      await connection.execute(
        `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // 2. If stock changed, write to inventory_logs
      if (stock !== undefined && stock !== oldStock) {
        const qtyChanged = stock - oldStock;
        const changeType = qtyChanged > 0 ? 'restock' : 'adjustment';
        const note = `Manual stock update by admin. Adjusted from ${oldStock} to ${stock}.`;

        await connection.execute(
          `INSERT INTO inventory_logs (product_id, user_id, order_id, change_type, quantity_changed, stock_before, stock_after, notes)
           VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`,
          [productId, userId, changeType, qtyChanged, oldStock, stock, note]
        );
      }

      await connection.commit();
      return NextResponse.json({ message: 'Product updated' }, { status: 200 });
    } catch (txErr) {
      await connection.rollback();
      throw txErr;
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    // Delete dependent records first to prevent foreign key constraint fails
    await query('DELETE FROM wishlist WHERE product_id = ?', [productId]);
    await query('DELETE FROM reviews WHERE product_id = ?', [productId]);
    await query('DELETE FROM order_items WHERE product_id = ?', [productId]);

    // Finally delete the main product row
    await query('DELETE FROM products WHERE id = ?', [productId]);

    return NextResponse.json(
      { message: 'Product deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
