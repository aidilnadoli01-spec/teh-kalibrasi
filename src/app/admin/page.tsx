'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signIn, signOut } from 'next-auth/react';
import { formatCurrency } from '@/lib/currency';
import SalesChart from '@/components/SalesChart';

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  total_price: number;
  status: 'pending' | 'processing' | 'ready' | 'completed' | 'cancelled';
  notes: string;
  payment_method: 'bank_transfer' | 'ewallet' | 'cod';
  payment_status: 'unpaid' | 'pending' | 'verified';
  payment_proof_url: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
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
  category_id?: number | null;
  category_name?: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'analytics' | 'customers'>('orders');
  
  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Customers
  const [customers, setCustomers] = useState<any[]>([]);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({isOpen: false, title: '', message: '', onConfirm: () => {}});

  // Notifications
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const showToast = (message: string, type: 'success'|'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [showProductForm, setShowProductForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    stock: '',
    category_id: '',
  });

  // Categories CRUD
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', slug: '' });

  // Users CRUD
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'customer' });

  // Login state
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role === 'admin') {
      fetchOrders();
      fetchProducts();
      fetchCategories();
      fetchCustomers();
    }
  }, [status, session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const result = await signIn('admin-credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        const msg = result.error.includes('admin privileges')
          ? 'Akun ini bukan admin. Gunakan akun admin yang valid.'
          : result.error.includes('Invalid email or password')
          ? 'Email atau password salah. Coba lagi.'
          : 'Login gagal. Periksa email dan password Anda.';
        setLoginError(msg);
        showToast(msg, 'error');
      } else {
        showToast('Login berhasil! Memuat dashboard...', 'success');
        // ✅ Paksa reload halaman untuk memperbarui session state secara instan
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      setLoginError('Terjadi kesalahan. Coba lagi.');
      showToast('Terjadi kesalahan saat login.', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    // ✅ Logout admin — hanya hapus admin session, tidak menyentuh user session
    signOut({ callbackUrl: '/admin' });
  };

  // ===== ORDERS =====
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
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
          notes,
          bank_name: bankName,
          bank_account_name: bankAccountName,
          bank_account_number: bankAccountNumber,
          customer_address: customerAddress,
        }),
      });
      if (response.ok) {
        showToast('Order updated successfully', 'success');
        setSelectedOrder(null);
        setNewStatus('');
        setNotes('');
        setBankName('');
        setBankAccountName('');
        setBankAccountNumber('');
        fetchOrders();
      }
    } catch (error) {
      showToast('Failed to update order', 'error');
    }
  };

  const updatePaymentStatus = async (orderId: number, newPaymentStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: newPaymentStatus }),
      });
      if (response.ok) {
        showToast('Payment status updated successfully', 'success');
        fetchOrders();
        // Refresh selected order
        if (selectedOrder) {
          const updated = { ...selectedOrder, payment_status: newPaymentStatus as Order['payment_status'] };
          setSelectedOrder(updated);
        }
      }
    } catch (error) {
      showToast('Failed to update payment status', 'error');
    }
  };

  const executeDeleteOrder = async (orderId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      if (response.ok) {
        showToast('Order deleted', 'success');
        setSelectedOrder(null);
        fetchOrders();
      } else {
        const error = await response.json().catch(() => ({}));
        showToast(`Failed to delete order: ${error.error || response.statusText}`, 'error');
      }
    } catch (error) {
      showToast(`Error: ${error instanceof Error ? error.message : 'Failed to delete order'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = (orderId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Pesanan',
      message: 'Kamu yakin ingin menghapus ini? Tindakan ini tidak dapat dibatalkan.',
      onConfirm: () => executeDeleteOrder(orderId)
    });
  };

  const exportOrdersCSV = () => {
    if (!orders || orders.length === 0) return;
    
    // Create CSV header
    const headers = ['Order ID', 'Date', 'Customer Name', 'Email', 'Total Price', 'Status', 'Payment Method', 'Payment Status'];
    
    // Map data
    const csvData = orders.map(order => [
      order.id,
      new Date(order.created_at).toLocaleDateString(),
      `"${order.customer_name}"`,
      order.customer_email,
      order.total_price,
      order.status,
      order.payment_method,
      order.payment_status
    ]);
    
    // Combine
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ===== PRODUCTS =====
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (Array.isArray(data)) {
        // Ensure price and stock are numbers
        const normalizedData = data.map((product: any) => ({
          ...product,
          price: parseFloat(product.price),
          stock: parseInt(product.stock),
        }));
        setProducts(normalizedData);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (Array.isArray(data)) setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCategorySubmmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      });
      if (response.ok) {
        showToast('Category added successfully', 'success');
        setShowCategoryForm(false);
        setCategoryForm({ name: '', description: '', slug: '' });
        fetchCategories();
      } else {
        showToast('Failed to add category', 'error');
      }
    } catch (error) {
      showToast('Error saving category', 'error');
    }
  };

  const executeDeleteCategory = async (id: number) => {
    try {
      const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchCategories();
        showToast('Category deleted', 'success');
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to delete category', 'error');
      }
    } catch (error) {
      showToast('Error deleting category', 'error');
    }
  };

  const handleDeleteCategory = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Kategori',
      message: 'Kamu yakin ingin menghapus ini? Produk yang menggunakannya akan dihapus kategorinya.',
      onConfirm: () => executeDeleteCategory(id)
    });
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = selectedUser ? `/api/users/${selectedUser.id}` : '/api/users';
      const method = selectedUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      if (response.ok) {
        showToast(selectedUser ? 'User updated successfully' : 'User added successfully', 'success');
        closeUserForm();
        fetchCustomers();
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to save user', 'error');
      }
    } catch (error) {
      showToast('Error saving user', 'error');
    }
  };

  const openUserForm = (user?: any) => {
    if (user) {
      setSelectedUser(user);
      setUserForm({
        name: user.name,
        email: user.email,
        password: '', // Leave blank when editing unless changing
        role: user.role || 'customer'
      });
    } else {
      setSelectedUser(null);
      setUserForm({ name: '', email: '', password: '', role: 'customer' });
    }
    setShowUserForm(true);
  };

  const closeUserForm = () => {
    setShowUserForm(false);
    setSelectedUser(null);
    setUserForm({ name: '', email: '', password: '', role: 'customer' });
  };

  const executeDeleteUser = async (id: number) => {
    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (response.ok) {
        showToast('User deleted successfully', 'success');
        fetchCustomers();
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to delete user', 'error');
      }
    } catch (error) {
      showToast('Error deleting user', 'error');
    }
  };

  const handleDeleteUser = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus User',
      message: 'Kamu yakin ingin menghapus user ini? Semua data terkait (kecuali order) akan hilang.',
      onConfirm: () => executeDeleteUser(id)
    });
  };

  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.imagePath) {
        setProductForm((prev) => ({ ...prev, image_url: data.imagePath }));
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch (error) {
      showToast('Error uploading image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.stock) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        image_url: productForm.image_url,
        stock: parseInt(productForm.stock),
        category_id: productForm.category_id ? parseInt(productForm.category_id) : null,
      };

      if (selectedProduct) {
        const response = await fetch(`/api/products/${selectedProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          showToast('Product updated', 'success');
          closeProductForm();
          fetchProducts();
        }
      } else {
        const response = await fetch('/api/products/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          showToast('Product created', 'success');
          closeProductForm();
          fetchProducts();
        }
      }
    } catch (error) {
      showToast('Failed to save product', 'error');
    }
  };

  const executeDeleteProduct = async (productId: number) => {
    try {
      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (response.ok) {
        showToast('Product deleted', 'success');
        setSelectedProduct(null);
        fetchProducts();
      }
    } catch (error) {
      showToast('Failed to delete product', 'error');
    }
  };

  const handleDeleteProduct = (productId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Produk',
      message: 'Kamu yakin ingin menghapus ini? Tindakan ini permanen.',
      onConfirm: () => executeDeleteProduct(productId)
    });
  };

  const closeProductForm = () => {
    setShowProductForm(false);
    setSelectedProduct(null);
    setProductForm({ name: '', description: '', price: '', image_url: '', stock: '', category_id: '' });
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
        category_id: product.category_id ? product.category_id.toString() : '',
      });
    } else {
      setSelectedProduct(null);
      setProductForm({ name: '', description: '', price: '', image_url: '', stock: '', category_id: '' });
    }
    setShowProductForm(true);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl font-bold animate-pulse">Checking session...</p>
      </div>
    );
  }

  if (!session || (session.user as any)?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🍵</div>
            <h1 className="text-3xl font-bold">Admin Login</h1>
            <p className="text-white/50 text-sm mt-1">Masuk ke dashboard Tehkalibrasi</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-bold mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setLoginError(''); }}
                className="w-full px-4 py-3 bg-white/10 text-white rounded-xl border border-white/20 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
                placeholder="admin@email.com"
                disabled={loginLoading}
                required
              />
            </div>
            <div>
              <label className="block text-white text-sm font-bold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
                className="w-full px-4 py-3 bg-white/10 text-white rounded-xl border border-white/20 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
                placeholder="••••••••"
                disabled={loginLoading}
                required
              />
            </div>

            {/* Error message */}
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"
              >
                <span className="text-red-400 text-xl">⚠️</span>
                <p className="text-red-400 text-sm font-medium">{loginError}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loginLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <span>Memverifikasi...</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#111111] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
              <h3 className="text-xl font-bold text-white mb-2">{confirmDialog.title}</h3>
              <p className="text-white/70 mb-6">{confirmDialog.message}</p>
              
              <div className="flex gap-3 justify-end items-center">
                <button
                  onClick={() => setConfirmDialog(d => ({ ...d, isOpen: false }))}
                  className="px-4 py-2 rounded-lg font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setConfirmDialog(d => ({ ...d, isOpen: false }));
                    confirmDialog.onConfirm();
                  }}
                  className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 right-8 z-[9000] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 font-medium ${toast.type === 'success' ? 'bg-[#25D366] text-black shadow-[0_0_15px_rgba(37,211,102,0.5)]' : 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}
          >
            <span className="text-2xl">{toast.type === 'success' ? '✅' : '⚠️'}</span>
            <p className="font-bold">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="pb-20 pt-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h1 className="text-4xl md:text-5xl font-bold">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-all w-full md:w-auto"
            >
              Logout
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-white/10 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none">
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
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-3 font-bold transition-all ${
                activeTab === 'categories'
                  ? 'border-b-2 border-emerald-500 text-emerald-500'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-6 py-3 font-bold transition-all ${
                activeTab === 'customers'
                  ? 'border-b-2 border-emerald-500 text-emerald-500'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Customers
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'border-b-2 border-emerald-500 text-emerald-500'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Analytics
            </button>
          </div>

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-lg p-6"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold">Orders</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={exportOrdersCSV}
                        className="px-4 py-2 bg-emerald-500/20 text-emerald-500 font-bold rounded hover:bg-emerald-500/30 transition-all border border-emerald-500/50"
                      >
                        Export CSV
                      </button>
                      <button
                        onClick={fetchOrders}
                        className="px-4 py-2 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-600 transition-all"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <p className="text-white/60">Loading...</p>
                  ) : !orders || orders.length === 0 ? (
                    <p className="text-white/60 text-center py-8">No orders yet</p>
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
                            <tr key={order.id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="py-3 px-4">#{order.id}</td>
                              <td className="py-3 px-4">
                                <p className="font-bold">{order.customer_name}</p>
                                <p className="text-white/50 text-xs">{order.customer_email}</p>
                              </td>
                              <td className="py-3 px-4 font-bold text-emerald-500">
                                {formatCurrency(parseFloat(String(order.total_price)))}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    order.status === 'pending'
                                      ? 'bg-yellow-500/20 text-yellow-500'
                                      : order.status === 'processing'
                                      ? 'bg-blue-500/20 text-blue-500'
                                      : order.status === 'ready'
                                      ? 'bg-purple-500/20 text-purple-500'
                                      : order.status === 'completed'
                                      ? 'bg-green-500/20 text-green-500'
                                      : 'bg-red-500/20 text-red-500'
                                  }`}
                                >
                                  {order.status === 'pending' ? 'Menunggu' : 
                                   order.status === 'processing' ? 'Disiapkan' :
                                   order.status === 'ready' ? 'Siap Diambil' :
                                   order.status === 'completed' ? 'Selesai' : 
                                   'Dibatalkan'}
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
                                    setBankName(order.bank_name || '');
                                    setBankAccountName(order.bank_account_name || '');
                                    setBankAccountNumber(order.bank_account_number || '');
                                    setCustomerAddress(order.customer_address || '');
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

              <div>
                {selectedOrder ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 rounded-lg p-6 static lg:sticky top-32"
                  >
                    <h3 className="text-xl font-bold mb-6">Order #{selectedOrder.id}</h3>
                    <div className="space-y-4 mb-6">
                      <div>
                        <p className="text-white/60 text-sm">Name</p>
                        <p className="font-bold">{selectedOrder.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm">Email</p>
                        <p className="font-bold break-all">{selectedOrder.customer_email}</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm">Phone</p>
                        <a 
                          href={`https://wa.me/${selectedOrder.customer_phone.replace(/\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Halo Kak ${selectedOrder.customer_name}! 👋\n\nTerima kasih telah berbelanja di *Tehkalibrasi*.\nIni adalah pesan dari Admin untuk konfirmasi pesanan Anda dengan Order ID: *#${selectedOrder.id}*.\n\nTotal tagihan: *${formatCurrency(parseFloat(String(selectedOrder.total_price)))}*.\nMetode Pembayaran: *${selectedOrder.payment_method.toUpperCase()}*\n\nJika ada pertanyaan terkait pengiriman atau pembayaran pesanan, silakan balas pesan ini ya Kak. Terima kasih! ☕`)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-bold text-emerald-500 hover:text-emerald-400 hover:underline flex items-center gap-2 w-max"
                          title="Chat via WhatsApp"
                        >
                          {selectedOrder.customer_phone}
                          <span className="text-xs bg-[#25D366] px-2 py-0.5 rounded text-black font-bold flex items-center gap-1">
                            <span>💬</span> Chat WA
                          </span>
                        </a>
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-2">Status</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="w-full px-4 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none [&>option]:bg-neutral-900 [&>option]:text-white"
                        >
                          <option value="pending">Menunggu Konfirmasi</option>
                          <option value="processing">Sedang Disiapkan</option>
                          <option value="ready">Siap Diambil (Pickup)</option>
                          <option value="completed">Selesai (Sudah Diambil)</option>
                          <option value="cancelled">Batalkan Pesanan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-2">Notes</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-2">Lokasi Pengambilan (Pickup Address)</label>
                        <textarea
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          rows={2}
                          className="w-full px-4 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none placeholder-white/20"
                          placeholder="Masukkan alamat toko/lokasi pengambilan..."
                        />
                      </div>

                      {/* Payment Section */}
                      <div className="border-t border-white/20 pt-4 mt-4">
                        <p className="text-white/60 text-sm mb-3 font-bold">Payment Information</p>
                        <div className="space-y-3">
                          <div>
                            <p className="text-white/60 text-xs">Payment Method</p>
                            <p className="text-white font-bold">
                              {selectedOrder.payment_method === 'bank_transfer'
                                ? 'Bank Transfer'
                                : selectedOrder.payment_method === 'ewallet'
                                ? 'E-Wallet'
                                : 'Bayar di Tempat (Pickup)'}
                            </p>
                          </div>
                          <div>
                            <p className="text-white/60 text-xs mb-2">Payment Status</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => updatePaymentStatus(selectedOrder.id, 'unpaid')}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                                  selectedOrder.payment_status === 'unpaid'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                                }`}
                              >
                                Unpaid
                              </button>
                              <button
                                onClick={() => updatePaymentStatus(selectedOrder.id, 'pending')}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                                  selectedOrder.payment_status === 'pending'
                                    ? 'bg-yellow-500 text-black'
                                    : 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                                }`}
                              >
                                Pending
                              </button>
                              <button
                                onClick={() => updatePaymentStatus(selectedOrder.id, 'verified')}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                                  selectedOrder.payment_status === 'verified'
                                    ? 'bg-green-500 text-black'
                                    : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                                }`}
                              >
                                Verified
                              </button>
                            </div>
                          </div>

                          {/* Payment Proof */}
                          {selectedOrder.payment_proof_url && (
                            <div>
                              <p className="text-white/60 text-xs mb-2">Payment Proof</p>
                              <img
                                src={selectedOrder.payment_proof_url}
                                alt="Payment proof"
                                className="w-full h-auto rounded border border-emerald-500/30 max-h-48 object-contain cursor-pointer hover:scale-105 transition-all"
                              onClick={() => window.open(selectedOrder.payment_proof_url ?? undefined, '_blank')}
                              />
                            </div>
                          )}

                          {/* Bank Details for Bank Transfer */}
                          {selectedOrder.payment_method === 'bank_transfer' && (
                            <div className="border-t border-white/20 pt-3 mt-3">
                              <p className="text-white/60 text-xs mb-2 font-bold">Bank Details</p>
                              <div className="space-y-2">
                                <div>
                                  <input
                                    type="text"
                                    placeholder="Nama Bank (cth. BCA, Mandiri)"
                                    value={bankName}
                                    maxLength={30}
                                    onChange={(e) => {
                                      // Hanya huruf, spasi, dan titik
                                      const val = e.target.value.replace(/[^a-zA-Z\s.]/g, '');
                                      setBankName(val);
                                    }}
                                    className="w-full px-3 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none text-sm placeholder-white/40"
                                  />
                                  <p className="text-white/30 text-xs mt-0.5">{bankName.length}/30 karakter — hanya huruf & spasi</p>
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    placeholder="Nama Pemilik Rekening"
                                    value={bankAccountName}
                                    maxLength={50}
                                    onChange={(e) => {
                                      // Hanya huruf dan spasi
                                      const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                      setBankAccountName(val);
                                    }}
                                    className="w-full px-3 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none text-sm placeholder-white/40"
                                  />
                                  <p className="text-white/30 text-xs mt-0.5">{bankAccountName.length}/50 karakter — hanya huruf & spasi</p>
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Nomor Rekening (hanya angka)"
                                    value={bankAccountNumber}
                                    maxLength={20}
                                    onChange={(e) => {
                                      // Hanya angka
                                      const val = e.target.value.replace(/\D/g, '');
                                      setBankAccountNumber(val);
                                    }}
                                    className="w-full px-3 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none text-sm placeholder-white/40 tracking-widest"
                                  />
                                  <p className="text-white/30 text-xs mt-0.5">{bankAccountNumber.length}/20 digit — hanya angka</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Items */}
                      {selectedOrder.items && selectedOrder.items.length > 0 && (
                        <div className="border-t border-white/20 pt-4 mt-4">
                          <p className="text-white/60 text-sm mb-3 font-bold">Order Items</p>
                          <div className="space-y-2">
                            {selectedOrder.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm text-white/80">
                                <span>{item.product_name} x{item.quantity}</span>
                                <span>{formatCurrency(parseFloat(String(item.price)))}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 mt-4">
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.id)}
                        className="w-full py-2 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-600 transition-all"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => deleteOrder(selectedOrder.id)}
                        disabled={loading}
                        className="w-full py-2 bg-red-500 text-white font-bold rounded hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="w-full py-2 bg-white/10 text-white font-bold rounded hover:bg-white/20 transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 rounded-lg p-6 static lg:sticky top-32 text-center text-white/60"
                  >
                    <p>Select an order to view details</p>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-lg p-6"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold">Products</h2>
                    <button
                      onClick={() => openProductForm()}
                      className="px-4 py-2 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-600 transition-all"
                    >
                      + Add Product
                    </button>
                  </div>

                  {!products || products.length === 0 ? (
                    <p className="text-white/60 text-center py-8">No products yet</p>
                  ) : (
                    <div className="space-y-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-4">ID</th>
                            <th className="text-left py-3 px-4">Name</th>
                            <th className="text-left py-3 px-4">Category</th>
                            <th className="text-left py-3 px-4">Price</th>
                            <th className="text-left py-3 px-4">Stock</th>
                            <th className="text-left py-3 px-4">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product) => (
                            <tr key={product.id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="py-3 px-4">#{product.id}</td>
                              <td className="py-3 px-4 font-bold">{product.name}</td>
                              <td className="py-3 px-4 text-white/50">{product.category_name || '-'}</td>
                              <td className="py-3 px-4 text-emerald-500 font-bold">
                                {formatCurrency(parseFloat(String(product.price)))}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    product.stock > 0
                                      ? 'bg-green-500/20 text-green-500'
                                      : 'bg-red-500/20 text-red-500'
                                  }`}
                                >
                                  {product.stock}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => openProductForm(product)}
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

              <div>
                {showProductForm && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 rounded-lg p-6 static lg:sticky top-32"
                  >
                    <h3 className="text-xl font-bold mb-6">
                      {selectedProduct ? 'Edit Product' : 'Add Product'}
                    </h3>
                    <form onSubmit={handleSaveProduct} className="space-y-4">
                      <div>
                        <label className="block text-white text-sm font-bold mb-2">Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={productForm.name}
                          onChange={handleProductFormChange}
                          className="w-full px-4 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-bold mb-2">Description</label>
                        <textarea
                          name="description"
                          value={productForm.description}
                          onChange={handleProductFormChange}
                          rows={2}
                          className="w-full px-4 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-bold mb-2">Category</label>
                        <select
                          name="category_id"
                          value={productForm.category_id}
                          onChange={handleProductFormChange}
                          className="w-full px-4 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none [&>option]:bg-neutral-900 [&>option]:text-white"
                        >
                          <option value="" className="bg-neutral-900 text-white">No Category</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id} className="bg-neutral-900 text-white">{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-white text-sm font-bold mb-2">Price *</label>
                        <input
                          type="number"
                          name="price"
                          value={productForm.price}
                          onChange={handleProductFormChange}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full px-4 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-bold mb-2">Product Image</label>
                        <div className="space-y-3">
                          {productForm.image_url && (
                            <div className="relative w-full h-32 bg-white/10 rounded overflow-hidden">
                              <img
                                src={productForm.image_url}
                                alt="Product"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <label className="flex items-center justify-center px-4 py-3 bg-white/10 text-white rounded border-2 border-dashed border-white/20 hover:border-emerald-500 cursor-pointer transition-all">
                            <span className="text-sm font-semibold">
                              {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                              className="hidden"
                            />
                          </label>
                          <p className="text-white/40 text-xs">Max 5MB. JPEG, PNG, WebP, GIF</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-white text-sm font-bold mb-2">Stock *</label>
                        <input
                          type="number"
                          name="stock"
                          value={productForm.stock}
                          onChange={handleProductFormChange}
                          className="w-full px-4 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <button
                          type="submit"
                          className="w-full py-2 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-600 transition-all"
                        >
                          {selectedProduct ? 'Update' : 'Create'}
                        </button>
                        {selectedProduct && (
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(selectedProduct.id)}
                            className="w-full py-2 bg-red-500 text-white font-bold rounded hover:bg-red-600 transition-all"
                          >
                            Delete
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={closeProductForm}
                          className="w-full py-2 bg-white/10 text-white font-bold rounded hover:bg-white/20 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* CUSTOMERS TAB */}
          {activeTab === 'customers' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold">Registered Customers</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => openUserForm()}
                    className="px-4 py-2 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-600 transition-all"
                  >
                    + Add User
                  </button>
                  <button
                    onClick={fetchCustomers}
                    className="px-4 py-2 bg-white/10 text-white font-bold rounded hover:bg-white/20 transition-all"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Add/Edit User Form */}
              {showUserForm && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6 overflow-hidden"
                >
                  <h3 className="text-xl font-bold mb-4">{selectedUser ? 'Edit User' : 'Add New User'}</h3>
                  <form onSubmit={handleUserSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Name *</label>
                        <input
                          type="text"
                          required
                          value={userForm.name}
                          onChange={e => setUserForm({...userForm, name: e.target.value})}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded focus:border-emerald-500 outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Email *</label>
                        <input
                          type="email"
                          required
                          value={userForm.email}
                          onChange={e => setUserForm({...userForm, email: e.target.value})}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded focus:border-emerald-500 outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">
                          {selectedUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                        </label>
                        <input
                          type="password"
                          required={!selectedUser}
                          value={userForm.password}
                          onChange={e => setUserForm({...userForm, password: e.target.value})}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded focus:border-emerald-500 outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Role *</label>
                        <select
                          required
                          value={userForm.role}
                          onChange={e => setUserForm({...userForm, role: e.target.value})}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded focus:border-emerald-500 outline-none text-white [&>option]:bg-neutral-900 [&>option]:text-white"
                        >
                          <option value="customer" className="bg-neutral-900 text-white">Customer</option>
                          <option value="admin" className="bg-neutral-900 text-white">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-6 py-2 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-600">
                        {selectedUser ? 'Update User' : 'Create User'}
                      </button>
                      <button type="button" onClick={closeUserForm} className="px-6 py-2 bg-white/10 text-white font-bold rounded hover:bg-white/20">Cancel</button>
                    </div>
                  </form>
                </motion.div>
              )}
              
              <div className="bg-white/5 border border-white/10 rounded-lg overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="py-4 px-6 text-white/50 font-medium">User ID</th>
                      <th className="py-4 px-6 text-white/50 font-medium">Name</th>
                      <th className="py-4 px-6 text-white/50 font-medium">Email</th>
                      <th className="py-4 px-6 text-white/50 font-medium">Joined At</th>
                       <th className="py-4 px-6 text-white/50 font-medium text-center">Total Orders</th>
                      <th className="py-4 px-6 text-white/50 font-medium text-right">Total Spent</th>
                      <th className="py-4 px-6 text-white/50 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-white/50">No customers found</td>
                      </tr>
                    ) : (
                      customers.map(user => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-6">#{user.id}</td>
                          <td className="py-4 px-6 font-bold">{user.name}</td>
                          <td className="py-4 px-6">{user.email}</td>
                          <td className="py-4 px-6 text-sm text-white/70">{new Date(user.created_at).toLocaleDateString()}</td>
                          <td className="py-4 px-6 text-center">{user.total_orders}</td>
                          <td className="py-4 px-6 text-right text-emerald-500 font-bold">{formatCurrency(parseFloat(user.total_spent))}</td>
                          <td className="py-4 px-6 text-right flex gap-3 justify-end">
                            <button
                              onClick={() => openUserForm(user)}
                              className="text-emerald-500 hover:text-emerald-400 text-sm font-bold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-500 hover:text-red-400 text-sm font-bold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold">Categories</h2>
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="px-4 py-2 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-600 transition-all"
                >
                  Add Category
                </button>
              </div>

              {/* Add Category Form */}
              {showCategoryForm && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-bold mb-4">New Category</h3>
                  <form onSubmit={handleCategorySubmmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Name *</label>
                        <input
                          type="text"
                          required
                          value={categoryForm.name}
                          onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded focus:border-emerald-500 outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Slug *</label>
                        <input
                          type="text"
                          required
                          value={categoryForm.slug}
                          onChange={e => setCategoryForm({...categoryForm, slug: e.target.value})}
                          placeholder="e.g. green-tea"
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded focus:border-emerald-500 outline-none text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-1">Description</label>
                      <textarea
                        value={categoryForm.description}
                        onChange={e => setCategoryForm({...categoryForm, description: e.target.value})}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded focus:border-emerald-500 outline-none text-white"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-6 py-2 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-600">Save</button>
                      <button type="button" onClick={() => setShowCategoryForm(false)} className="px-6 py-2 bg-white/10 text-white font-bold rounded hover:bg-white/20">Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white/5 border border-white/10 rounded-lg overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="py-4 px-6 text-white/50 font-medium">ID</th>
                      <th className="py-4 px-6 text-white/50 font-medium">Name</th>
                      <th className="py-4 px-6 text-white/50 font-medium">Slug</th>
                      <th className="py-4 px-6 text-white/50 font-medium">Description</th>
                      <th className="py-4 px-6 text-white/50 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-white/50">No categories found</td></tr>
                    ) : (
                      categories.map(cat => (
                        <tr key={cat.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-6 text-white/60">#{cat.id}</td>
                          <td className="py-4 px-6 font-bold">{cat.name}</td>
                          <td className="py-4 px-6 text-emerald-500">{cat.slug}</td>
                          <td className="py-4 px-6 text-sm text-white/50 truncate max-w-xs">{cat.description || '-'}</td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-red-500 hover:text-red-400 text-sm font-bold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                  <h3 className="text-white/50 mb-2">Total Revenue</h3>
                  <p className="text-3xl font-bold text-emerald-500">
                    {formatCurrency(orders.reduce((sum, order) => sum + parseFloat(String(order.total_price)), 0))}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                  <h3 className="text-white/50 mb-2">Total Orders</h3>
                  <p className="text-3xl font-bold">{orders.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                  <h3 className="text-white/50 mb-2">Total Customers</h3>
                  <p className="text-3xl font-bold">{customers.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                  <h3 className="text-white/50 mb-2">Total Products</h3>
                  <p className="text-3xl font-bold">{products.length}</p>
                </div>
              </div>

              <SalesChart />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
