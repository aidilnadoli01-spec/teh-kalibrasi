# Setup Database & Order System

## Prerequisites
- XAMPP running (with MySQL)
- Node.js installed

## 1. Database Setup

### Option A: Using phpMyAdmin (Recommended)
1. Open `http://localhost/phpmyadmin`
2. Click on "SQL" tab or "New" to create database
3. Copy the content from `database.sql`
4. Paste it in the SQL editor
5. Click "Go" to execute

### Option B: Using MySQL Command Line
```bash
mysql -u root -p < database.sql
```

### Option C: Manual Setup
1. Open MySQL CLI:
   ```bash
   mysql -u root
   ```

2. Run commands from `database.sql`:
   ```sql
   CREATE DATABASE prototype_teh;
   USE prototype_teh;
   
   -- Then run all CREATE TABLE statements from database.sql
   ```

## 2. Configure Environment

Update `.env.local` with your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_DATABASE=prototype_teh
DB_PORT=3306
```

## 3. Install Dependencies

```bash
npm install
```

This will install mysql2 package needed for database connection.

## 4. Run Development Server

```bash
npm run dev
```

Server will run on `http://localhost:3000`

## 5. Access the Application

### Customer Pages:
- **Home**: http://localhost:3000
- **Products Catalog**: http://localhost:3000/products
- **Order Your Collection Button**: Links to `/products` page

### Admin Panel:
- **Admin Dashboard**: http://localhost:3000/admin
- **Login Credentials**:
  - Username: `admin`
  - Password: `admin123`

## Database Schema

### Tables Created:
1. **products** - Product catalog
   - id, name, description, price, image_url, stock

2. **orders** - Customer orders
   - id, customer_name, customer_email, customer_phone, customer_address, total_price, status, notes

3. **order_items** - Items in each order
   - id, order_id, product_id, quantity, price

4. **admin_users** - Admin accounts
   - id, username, email, password_hash

## API Routes

### Products API
- `GET /api/products` - Get all products

### Orders API
- `GET /api/orders` - Get all orders (for admin)
- `POST /api/orders` - Create new order
- `GET /api/orders/[id]` - Get order details
- `PUT /api/orders/[id]` - Update order status
- `DELETE /api/orders/[id]` - Delete order

## Features Implemented

✅ Product catalog with shopping cart
✅ Order management system
✅ Admin dashboard with order tracking
✅ Product stock management
✅ Order status tracking (pending → processing → shipped → delivered)
✅ MySQL database with proper relationships
✅ Admin login (demo credentials)
✅ Checkout form with customer details

## Sample Products in Database

- Premium Collection Vol 1 - $99.99
- Premium Collection Vol 2 - $129.99
- Exclusive Calibration Set - $199.99
- Limited Edition Bundle - $249.99
- Standard Pack - $49.99

## Troubleshooting

### "mysql is not recognized" error
- Make sure MySQL is running in XAMPP Control Panel
- Check DB_HOST, DB_USER, and DB_PASSWORD in `.env.local`

### "Cannot connect to database"
- Verify MySQL credentials in `.env.local`
- Make sure database was created successfully
- Check XAMPP MySQL service is running

### Products page shows "Loading products..."
- Check browser console for errors
- Verify API is connected to database
- Check `.env.local` configuration
