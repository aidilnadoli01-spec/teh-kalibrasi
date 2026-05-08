-- ==========================================
-- Prototype Teh Database Schema
-- Version: 2.0
-- Description: Improved schema for premium tea shop
-- ==========================================

CREATE DATABASE IF NOT EXISTS prototype_teh;
USE prototype_teh;

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Users Table (Unified for Admin and Customers)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  role ENUM('admin', 'customer') DEFAULT 'customer',
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT DEFAULT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  sale_price DECIMAL(12, 2) DEFAULT NULL,
  stock INT DEFAULT 0,
  weight INT DEFAULT 0, -- in grams
  image_url VARCHAR(500),
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 4. Promo Codes Table
CREATE TABLE IF NOT EXISTS promo_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
  discount_value DECIMAL(10, 2) NOT NULL,
  max_discount DECIMAL(10, 2) DEFAULT NULL,
  min_purchase DECIMAL(10, 2) DEFAULT 0,
  expiry_date DATETIME,
  usage_limit INT DEFAULT NULL,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT DEFAULT NULL,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  
  -- Customer Details (Snapshots for history)
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_address TEXT NOT NULL,
  
  -- Totals
  subtotal DECIMAL(12, 2) NOT NULL,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  shipping_cost DECIMAL(12, 2) DEFAULT 0,
  total_price DECIMAL(12, 2) NOT NULL,
  
  -- Statuses
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
  payment_status ENUM('unpaid', 'pending', 'paid', 'verified', 'failed') DEFAULT 'unpaid',
  payment_method ENUM('bank_transfer', 'ewallet', 'cod') NOT NULL DEFAULT 'bank_transfer',
  
  -- Shipping Info
  shipping_courier VARCHAR(100),
  tracking_number VARCHAR(100),
  
  -- Payment Details
  payment_proof_url VARCHAR(500),
  bank_name VARCHAR(100),
  bank_account_name VARCHAR(100),
  bank_account_number VARCHAR(100),
  
  promo_code_id INT DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE SET NULL
);

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(12, 2) NOT NULL, -- Price at time of purchase
  subtotal DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- 7. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  order_id INT DEFAULT NULL,
  rating INT NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- 8. Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ==========================================
-- SEED DATA
-- ==========================================

-- Insert Categories
INSERT IGNORE INTO categories (name, slug, description) VALUES 
('Black Tea', 'black-tea', 'Strong, bold flavors and fully oxidized leaves.'),
('Green Tea', 'green-tea', 'Light, refreshing and packed with antioxidants.'),
('Herbal Blend', 'herbal-blend', 'Caffeine-free infusions of herbs, flowers, and fruits.'),
('Oolong Tea', 'oolong-tea', 'Semi-oxidized teas with complex, floral to nutty profiles.'),
('Teaware', 'teaware', 'Essential tools for the perfect brewing experience.');

-- Insert Users (password: admin123 and user123 - hashed with bcrypt)
INSERT IGNORE INTO users (name, email, password_hash, role) VALUES
('Administrator', 'admin@tehkalibrasi.com', '$2b$10$M9XT3VRXrZbWyjfPj4j3ROqvO8JKJwjX0J5JzP5q2s2KQ5q8QZJje', 'admin'),
('John Doe', 'john@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer');

-- Insert Products
INSERT IGNORE INTO products (category_id, name, slug, description, price, stock, weight, is_featured) VALUES
(1, 'Premium Black Gold', 'premium-black-gold', 'Our finest black tea from the high mountains.', 125000, 50, 100, TRUE),
(1, 'Classic Earl Grey', 'classic-earl-grey', 'Traditional black tea infused with bergamot.', 85000, 100, 100, FALSE),
(2, 'Jasmine Dragon Pearls', 'jasmine-dragon-pearls', 'Hand-rolled green tea scented with fresh jasmine.', 150000, 30, 50, TRUE),
(2, 'Matcha Ceremonial Grade', 'matcha-ceremonial', 'Finely stone-ground green tea powder from Uji.', 250000, 20, 30, TRUE),
(3, 'Midnight Lavender', 'midnight-lavender', 'Calming blend of lavender, chamomile, and mint.', 75000, 45, 80, FALSE),
(5, 'Glass Gaiwan Set', 'glass-gaiwan-set', 'Modern glass gaiwan for appreciating tea color.', 350000, 15, 500, FALSE);

-- Insert Promo Codes
INSERT IGNORE INTO promo_codes (code, discount_type, discount_value, min_purchase, is_active) VALUES 
('WELCOME20', 'percentage', 20, 0, TRUE),
('TEHTIME10K', 'fixed', 10000, 50000, TRUE);
