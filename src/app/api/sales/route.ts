import { getConnection } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  let connection;
  try {
    connection = await getConnection();
    
    // Get daily sales data (last 30 days)
    const [salesData] = await connection.execute(`
      SELECT 
        DATE(created_at) as date,
        SUM(total_price) as total_sales,
        COUNT(*) as order_count
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `) as any;

    // Get total metrics
    const [metrics] = await connection.execute(`
      SELECT 
        SUM(total_price) as total_revenue,
        COUNT(*) as total_orders,
        COUNT(DISTINCT customer_email) as unique_customers,
        AVG(total_price) as avg_order_value
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `) as any;

    // Get payment status breakdown
    const [paymentBreakdown] = await connection.execute(`
      SELECT 
        payment_status,
        COUNT(*) as count,
        SUM(total_price) as total
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY payment_status
    `) as any;

    // Get top products
    const [topProducts] = await connection.execute(`
      SELECT 
        p.name as product_name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.quantity * oi.price) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY p.id, p.name
      ORDER BY total_revenue DESC
      LIMIT 5
    `) as any;

    return NextResponse.json({
      salesData: salesData.map((row: any) => ({
        date: new Date(row.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
        total_sales: parseFloat(row.total_sales || 0),
        order_count: row.order_count,
      })),
      metrics: metrics[0] || {
        total_revenue: 0,
        total_orders: 0,
        unique_customers: 0,
        avg_order_value: 0,
      },
      paymentBreakdown: paymentBreakdown.map((row: any) => ({
        status: row.payment_status,
        count: row.count,
        total: parseFloat(row.total || 0),
      })),
      topProducts: topProducts.map((row: any) => ({
        name: row.product_name,
        quantity: row.total_quantity,
        revenue: parseFloat(row.total_revenue || 0),
      })),
    });
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
