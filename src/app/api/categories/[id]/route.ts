import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if category is used in products
    const products: any = await query('SELECT id FROM products WHERE category_id = ?', [id]);
    
    if (products && products.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category because it is being used by existing products. Please reassign products first.' }, 
        { status: 400 }
      );
    }

    await query('DELETE FROM categories WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
