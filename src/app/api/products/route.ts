import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const products = await query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `);
    
    // Ensure products is always an array
    const productsArray = Array.isArray(products) ? products : [];
    
    return NextResponse.json(productsArray, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    // Return empty array instead of error to prevent frontend crash
    return NextResponse.json([], { status: 200 });
  }
}
