import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log('Starting migration...');
    
    // 1. Check if we need to update orders.status column
    await query("ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'");
    console.log('Modified status column to VARCHAR');

    // 2. Map old values to new values in DB
    await query("UPDATE orders SET status = 'ready' WHERE status = 'shipped'");
    await query("UPDATE orders SET status = 'completed' WHERE status = 'delivered'");
    console.log('Migrated old status values');

    // 3. Alter users table to add OTP & verification fields if not exists
    const columns: any = await query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'"
    );
    const columnNames = columns.map((c: any) => c.COLUMN_NAME.toLowerCase());
    
    if (!columnNames.includes('otp_code')) {
      await query("ALTER TABLE users ADD COLUMN otp_code VARCHAR(255) DEFAULT NULL");
      console.log('Added otp_code column');
    }
    if (!columnNames.includes('otp_expired_at')) {
      await query("ALTER TABLE users ADD COLUMN otp_expired_at DATETIME DEFAULT NULL");
      console.log('Added otp_expired_at column');
    }
    if (!columnNames.includes('otp_attempt')) {
      await query("ALTER TABLE users ADD COLUMN otp_attempt INT DEFAULT 0");
      console.log('Added otp_attempt column');
    }
    if (!columnNames.includes('is_verified')) {
      await query("ALTER TABLE users ADD COLUMN is_verified TINYINT(1) DEFAULT 0");
      console.log('Added is_verified column');
    }
    if (!columnNames.includes('email_verified_at')) {
      await query("ALTER TABLE users ADD COLUMN email_verified_at DATETIME DEFAULT NULL");
      console.log('Added email_verified_at column');
    }

    // 4. Backward compatibility: verify existing users
    await query("UPDATE users SET is_verified = 1 WHERE is_verified = 0");
    console.log('Auto-verified existing users');

    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully. Status column and OTP verification columns are ready.' 
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
