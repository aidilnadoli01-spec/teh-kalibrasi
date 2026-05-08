'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  total_price: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes: string;
  created_at: string;
  items: any[];
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  
  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    stock: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simple authentication - in production, use proper backend validation
    if (username === 'admin' && password === 'admin123') {
      setIsLoggedIn(true);
      setUsername('');
      setPassword('');
      fetchOrders();
      fetchProducts();
    } else {
      alert('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setOrders([]);
    setProducts([]);
    setSelectedOrder(null);
    setSelectedProduct(null);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        console.error('Invalid orders data format');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number) => {
    if (!newStatus) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes: notes,
        }),
      });

      if (response.ok) {
        alert('Order updated successfully');
        setNewStatus('');
        setNotes('');
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    }
  };

  const deleteOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Order deleted successfully');
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
  };

  // Product Management Functions
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productForm.name || !productForm.price || !productForm.stock) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        image_url: productForm.image_url,
        stock: parseInt(productForm.stock),
      };

      if (selectedProduct) {
        // Update existing product
        const response = await fetch(`/api/products/${selectedProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          alert('Product updated successfully');
          setShowProductForm(false);
          setSelectedProduct(null);
          setProductForm({ name: '', description: '', price: '', image_url: '', stock: '' });
          fetchProducts();
        }
      } else {
        // Create new product
        const response = await fetch('/api/products/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          alert('Product created successfully');
          setShowProductForm(false);
          setProductForm({ name: '', description: '', price: '', image_url: '', stock: '' });
          fetchProducts();
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Product deleted successfully');
        setSelectedProduct(null);
        setShowProductForm(false);
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const openProductForm = (product?: Product) => {
    if (product) {
      setSelectedProduct(product);
      setProductForm({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        image_url: product.image_url,
        stock: product.stock.toString(),
      });
    } else {
      setSelectedProduct(null);
      setProductForm({ name: '', description: '', price: '', image_url: '', stock: '' });
    }
    setShowProductForm(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 rounded-lg p-8 max-w-md w-full"
        >
          <h1 className="text-4xl font-bold mb-8 text-center">Admin Login</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-bold mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-bold mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none"
                placeholder="•••••••"
              />
            </div>

            <p className="text-white/50 text-xs">
              Demo: admin / admin123
            </p>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-600 transition-all"
            >
              Login
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="pb-20 pt-12">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-5xl font-bold">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-all"
            >
              Logout
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-white/10">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 font-bold transition-all ${
                activeTab === 'orders'
                  ? 'border-b-2 border-emerald-500 text-emerald-500'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 font-bold transition-all ${
                activeTab === 'products'
                  ? 'border-b-2 border-emerald-500 text-emerald-500'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Products
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Orders List */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-lg p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Orders</h2>
                  <button
                    onClick={fetchOrders}
                    className="px-4 py-2 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-600 transition-all"
                  >
                    Refresh
                  </button>
                </div>

                {loading ? (
                  <p className="text-white/60">Loading orders...</p>
                ) : !orders || orders.length === 0 ? (
                  <p className="text-white/60 text-center py-8">No orders yet. Make sure to setup database first.</p>
                ) : (
                  <div className="space-y-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4">ID</th>
                          <th className="text-left py-3 px-4">Customer</th>
                          <th className="text-left py-3 px-4">Total</th>
                          <th className="text-left py-3 px-4">Status</th>
                          <th className="text-left py-3 px-4">Date</th>
                          <th className="text-left py-3 px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr
                            key={order.id}
                            className="border-b border-white/5 hover:bg-white/5 transition-all"
                          >
                            <td className="py-3 px-4">#{order.id}</td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-bold">{order.customer_name}</p>
                                <p className="text-white/50 text-xs">{order.customer_email}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-bold text-emerald-500">
                              ${order.total_price.toFixed(2)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  order.status === 'pending'
                                    ? 'bg-yellow-500/20 text-yellow-500'
                                    : order.status === 'processing'
                                    ? 'bg-blue-500/20 text-blue-500'
                                    : order.status === 'shipped'
                                    ? 'bg-purple-500/20 text-purple-500'
                                    : order.status === 'delivered'
                                    ? 'bg-green-500/20 text-green-500'
                                    : 'bg-red-500/20 text-red-500'
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-white/50 text-xs">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setNewStatus(order.status);
                                  setNotes(order.notes || '');
                                }}
                                className="text-emerald-500 hover:text-emerald-400 font-bold"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Order Details Panel */}
            <div>
              {selectedOrder ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 rounded-lg p-6 sticky top-32"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Order #{selectedOrder.id}</h3>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-white/60 hover:text-white text-2xl"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-white/60 text-sm">Customer Name</p>
                      <p className="font-bold">{selectedOrder.customer_name}</p>
                    </div>

                    <div>
                      <p className="text-white/60 text-sm">Email</p>
                      <p className="font-bold break-all">{selectedOrder.customer_email}</p>
                    </div>

                    <div>
                      <p className="text-white/60 text-sm">Phone</p>
                      <p className="font-bold">{selectedOrder.customer_phone}</p>
                    </div>

                    <div>
                      <p className="text-white/60 text-sm">Address</p>
                      <p className="font-bold text-sm">{selectedOrder.customer_address}</p>
                    </div>

                    <div className="bg-white/10 rounded p-4">
                      {Array.isArray(selectedOrder.items) &&
                        selectedOrder.items.map((item: any) => (
                          <div
                            key={item.product_id}
                            className="flex justify-between text-sm mb-2"
                          >
                            <span>{item.product_name} x{item.quantity}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      <p className="border-t border-white/10 pt-2 mt-2 font-bold flex justify-between">
                        <span>Total:</span>
                        <span className="text-emerald-500">
                          ${selectedOrder.total_price.toFixed(2)}
                        </span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-white/60 text-sm mb-2">
                        Update Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white/60 text-sm mb-2">
                        Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id)}
                      className="w-full py-2 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-600 transition-all"
                    >
                      Update Order
                    </button>
                    <button
                      onClick={() => deleteOrder(selectedOrder.id)}
                      className="w-full py-2 bg-red-500 text-white font-bold rounded hover:bg-red-600 transition-all"
                    >
                      Delete Order
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 rounded-lg p-6 sticky top-32 text-center text-white/60"
                >
                  <p>Select an order to view details</p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
