const mysql = require('mysql2/promise');

async function runPatch() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'prototype_teh',
  });

  console.log('Connected to database. Applying patches...');

  try {
    // 1. Add role to users if missing
    try {
      await connection.execute("ALTER TABLE users ADD COLUMN role ENUM('admin', 'customer') DEFAULT 'customer' AFTER address");
      console.log('- Added "role" column to users table');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('- "role" column already exists in users');
      else throw e;
    }

    // 2. Add avatar_url to users if missing
    try {
      await connection.execute("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) AFTER role");
      console.log('- Added "avatar_url" column to users table');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('- "avatar_url" column already exists in users');
      else throw e;
    }

    // 3. Add slug to products if missing
    try {
      // Add as nullable first
      await connection.execute("ALTER TABLE products ADD COLUMN slug VARCHAR(255) AFTER name");
      console.log('- Added "slug" column to products table');
      
      // Update existing rows with a temporary slug based on ID
      await connection.execute("UPDATE products SET slug = CONCAT('product-', id) WHERE slug IS NULL OR slug = ''");
      console.log('- Populated temporary slugs for existing products');
      
      // Now make it NOT NULL and UNIQUE
      await connection.execute("ALTER TABLE products MODIFY COLUMN slug VARCHAR(255) NOT NULL UNIQUE");
      console.log('- Applied UNIQUE constraint to products.slug');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('- "slug" column already exists in products');
      else throw e;
    }

    // 4. Add other missing columns to products
    const productCols = [
      { name: 'sale_price', type: 'DECIMAL(12, 2) DEFAULT NULL' },
      { name: 'weight', type: 'INT DEFAULT 0' },
      { name: 'is_featured', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'is_active', type: 'BOOLEAN DEFAULT TRUE' }
    ];

    for (const col of productCols) {
      try {
        await connection.execute(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`);
        console.log(`- Added "${col.name}" column to products table`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log(`- "${col.name}" column already exists in products`);
        else throw e;
      }
    }

    // 5. Update categories
    try {
      await connection.execute("ALTER TABLE categories ADD COLUMN image_url VARCHAR(500) AFTER description");
      console.log('- Added "image_url" column to categories table');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('- "image_url" column already exists in categories');
      else throw e;
    }

    // 6. Update orders
    try {
      await connection.execute("ALTER TABLE orders ADD COLUMN order_number VARCHAR(50) AFTER user_id");
      console.log('- Added "order_number" column to orders table');
      
      await connection.execute("UPDATE orders SET order_number = CONCAT('TK-OLD-', id) WHERE order_number IS NULL OR order_number = ''");
      console.log('- Populated temporary order numbers for existing orders');
      
      await connection.execute("ALTER TABLE orders MODIFY COLUMN order_number VARCHAR(50) NOT NULL UNIQUE");
      console.log('- Applied UNIQUE constraint to orders.order_number');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('- "order_number" column already exists in orders');
      else throw e;
    }

    const orderCols = [
      { name: 'subtotal', type: 'DECIMAL(12, 2) NOT NULL DEFAULT 0' },
      { name: 'discount_amount', type: 'DECIMAL(12, 2) DEFAULT 0' },
      { name: 'shipping_cost', type: 'DECIMAL(12, 2) DEFAULT 0' },
      { name: 'shipping_courier', type: 'VARCHAR(100)' },
      { name: 'tracking_number', type: 'VARCHAR(100)' },
      { name: 'promo_code_id', type: 'INT DEFAULT NULL' }
    ];

    for (const col of orderCols) {
      try {
        await connection.execute(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
        console.log(`- Added "${col.name}" column to orders table`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log(`- "${col.name}" column already exists in orders`);
        else throw e;
      }
    }

    // 7. Update order_items
    try {
      await connection.execute("ALTER TABLE order_items ADD COLUMN subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0");
      console.log('- Added "subtotal" column to order_items table');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('- "subtotal" column already exists in order_items');
      else throw e;
    }

    console.log('Database synchronization complete!');
  } catch (error) {
    console.error('Error applying patch:', error);
  } finally {
    await connection.end();
  }
}

runPatch();
