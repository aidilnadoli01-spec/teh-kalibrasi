import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log('Starting migration...');
    
    // 1. Check if we need to update orders.status column
    // We'll just try to run the ALTER TABLE. If it's already VARCHAR or has the values, it might just work or we catch the error.
    // To be safe, we'll change it to VARCHAR(50) first to remove ENUM restrictions if any.
    await query("ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'");
    console.log('Modified status column to VARCHAR');

    // 2. Map old values to new values in DB
    await query("UPDATE orders SET status = 'ready' WHERE status = 'shipped'");
    await query("UPDATE orders SET status = 'completed' WHERE status = 'delivered'");
    console.log('Migrated old status values');

    // 3. (Optional) Change it back to ENUM if preferred, but VARCHAR is safer for now
    // await query("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'processing', 'ready', 'completed', 'cancelled') DEFAULT 'pending'");

    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully. Status column is now VARCHAR and old values are mapped.' 
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
