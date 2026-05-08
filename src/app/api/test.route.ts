import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test 1: Count products
    const products = await query('SELECT COUNT(*) as count FROM products');
    
    // Test 2: Count orders
    const orders = await query('SELECT COUNT(*) as count FROM orders');
    
    // Test 3: Get all data
    const allProducts = await query('SELECT * FROM products');
    const allOrders = await query('SELECT * FROM orders');

    return NextResponse.json({
      status: 'success',
      database: 'Connected to prototype_teh',
      productCount: (products as any)[0]?.count || 0,
      orderCount: (orders as any)[0]?.count || 0,
      products: allProducts,
      orders: allOrders,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      hint: 'Make sure database.sql has been executed in phpMyAdmin',
    }, { status: 500 });
  }
}
