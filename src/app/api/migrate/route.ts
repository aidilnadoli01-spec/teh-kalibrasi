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

    // 5. Create inventory_logs table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        product_id INT NOT NULL,
        user_id INT DEFAULT NULL,
        order_id INT DEFAULT NULL,
        change_type ENUM('sale', 'cancellation', 'restock', 'adjustment', 'refund') NOT NULL,
        quantity_changed INT NOT NULL,
        stock_before INT NOT NULL,
        stock_after INT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
      )
    `);
    console.log('Created inventory_logs table if not exists');

    // 6. Create payment_methods table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type VARCHAR(50) NOT NULL,
        method_name VARCHAR(100) NOT NULL,
        account_name VARCHAR(100) DEFAULT NULL,
        account_number VARCHAR(100) DEFAULT NULL,
        qr_image VARCHAR(255) DEFAULT NULL,
        logo VARCHAR(255) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created payment_methods table if not exists');

    // 7. Alter orders table to add payment_method_id and payment_method_name if they don't exist
    const orderColumns: any = await query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'"
    );
    const orderColumnNames = orderColumns.map((c: any) => c.COLUMN_NAME.toLowerCase());
    
    if (!orderColumnNames.includes('payment_method_id')) {
      await query("ALTER TABLE orders ADD COLUMN payment_method_id INT DEFAULT NULL");
      console.log('Added payment_method_id column to orders');
    }
    if (!orderColumnNames.includes('payment_method_name')) {
      await query("ALTER TABLE orders ADD COLUMN payment_method_name VARCHAR(100) DEFAULT NULL");
      console.log('Added payment_method_name column to orders');
    }
    if (!orderColumnNames.includes('payment_uploaded_at')) {
      await query("ALTER TABLE orders ADD COLUMN payment_uploaded_at DATETIME DEFAULT NULL");
      console.log('Added payment_uploaded_at column to orders');
    }
    if (!orderColumnNames.includes('payment_verified_at')) {
      await query("ALTER TABLE orders ADD COLUMN payment_verified_at DATETIME DEFAULT NULL");
      console.log('Added payment_verified_at column to orders');
    }
    if (!orderColumnNames.includes('payment_verified_by')) {
      await query("ALTER TABLE orders ADD COLUMN payment_verified_by INT DEFAULT NULL");
      console.log('Added payment_verified_by column to orders');
    }

    // 8. Seed initial payment methods if payment_methods is empty
    const currentMethods: any = await query("SELECT COUNT(*) as count FROM payment_methods");
    if (currentMethods && currentMethods[0] && currentMethods[0].count === 0) {
      await query(`
        INSERT INTO payment_methods (type, method_name, account_name, account_number, description, logo, is_active) VALUES
        ('bank_transfer', 'BCA', 'Tehkalibrasi Mandiri', '1234567890', 'Transfer ke bank BCA terdekat Anda.', '/logos/bca.png', 1),
        ('ewallet', 'Dana', 'Ahmad Tehkalibrasi', '08123456789', 'Transfer ke akun DANA kami.', '/logos/dana.png', 1),
        ('ewallet', 'OVO', 'Ahmad Tehkalibrasi', '08123456789', 'Transfer ke akun OVO kami.', '/logos/ovo.png', 1),
        ('ewallet', 'GoPay', 'Ahmad Tehkalibrasi', '08123456789', 'Transfer ke akun GoPay kami.', '/logos/gopay.png', 1),
        ('ewallet', 'ShopeePay', 'Ahmad Tehkalibrasi', '08123456789', 'Transfer ke akun ShopeePay kami.', '/logos/shopeepay.png', 1),
        ('qris', 'QRIS', 'TEHKALIBRASI', '', 'Scan kode QRIS ini untuk pembayaran instant.', '/logos/qris.png', 1),
        ('cod', 'COD', '', '', 'Bayar tunai di lokasi pengambilan (Pickup).', '/logos/cod.png', 1)
      `);
      console.log('Seeded default payment methods');
    }

    // 9. Create pending_users table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS pending_users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        otp_code VARCHAR(255) DEFAULT NULL,
        otp_expired_at DATETIME DEFAULT NULL,
        otp_attempt INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Created pending_users table if not exists');

    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully. Status column, OTP columns, inventory logs, payment systems, and pending users table are ready.' 
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
