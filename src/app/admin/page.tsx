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
  payment_uploaded_at?: string | null;
  payment_verified_at?: string | null;
  payment_verified_by?: number | null;
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

interface PaymentMethod {
  id: number;
  type: 'bank_transfer' | 'ewallet' | 'qris' | 'cod';
  method_name: string;
  account_name: string | null;
  account_number: string | null;
  qr_image: string | null;
  logo: string | null;
  description: string | null;
  is_active: number;
  created_at: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'analytics' | 'customers' | 'logs' | 'payments'>('orders');
  
  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isProofZoomed, setIsProofZoomed] = useState(false);

  // Customers
  const [customers, setCustomers] = useState<any[]>([]);

  // Inventory Logs
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    type?: 'danger' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Ya, Hapus',
    type: 'danger',
    onConfirm: () => {}
  });

  // Notifications
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const showToast = (message: string, type: 'success'|'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [showProductForm, setShowProductForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
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

  // Payments CRUD
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    type: 'bank_transfer',
    method_name: '',
    account_name: '',
    account_number: '',
    qr_image: '',
    logo: '',
    description: '',
    is_active: true,
  });
  const [uploadingPaymentImage, setUploadingPaymentImage] = useState(false);
  const [uploadingPaymentLogo, setUploadingPaymentLogo] = useState(false);

  // Login state
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role === 'admin') {
      fetchOrders();
      fetchProducts();
      fetchCategories();
      fetchCustomers();
      fetchInventoryLogs();
      fetchPaymentMethods();
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
    if (!newStatus) {
      showToast('Status pesanan tidak boleh kosong!', 'error');
      return;
    }
    setIsUpdating(true);
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
        showToast('Pesanan berhasil diupdate!', 'success');
        fetchOrders();
        // Auto-sync
        if (selectedOrder) {
          setSelectedOrder({
            ...selectedOrder,
            status: newStatus as Order['status'],
            notes,
            bank_name: bankName,
            bank_account_name: bankAccountName,
            bank_account_number: bankAccountNumber,
            customer_address: customerAddress
          });
        }
      } else {
        const error = await response.json().catch(() => ({}));
        showToast(`Gagal update: ${error.error || response.statusText}`, 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan saat update pesanan', 'error');
    } finally {
      setIsUpdating(false);
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

  const fetchInventoryLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch('/api/admin/inventory-logs');
      const data = await response.json();
      setInventoryLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching inventory logs:', error);
      setInventoryLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role === 'admin' && activeTab === 'logs') {
      fetchInventoryLogs();
    }
  }, [activeTab, status, session]);

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

  // ===== PAYMENT METHODS CRUD =====
  const fetchPaymentMethods = async () => {
    setLoadingPayments(true);
    try {
      const response = await fetch('/api/payment-methods');
      const data = await response.json();
      setPaymentMethods(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setPaymentMethods([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const openPaymentForm = (payment?: PaymentMethod) => {
    if (payment) {
      setSelectedPayment(payment);
      setPaymentForm({
        type: payment.type,
        method_name: payment.method_name,
        account_name: payment.account_name || '',
        account_number: payment.account_number || '',
        qr_image: payment.qr_image || '',
        logo: payment.logo || '',
        description: payment.description || '',
        is_active: payment.is_active === 1,
      });
    } else {
      setSelectedPayment(null);
      setPaymentForm({
        type: 'bank_transfer',
        method_name: '',
        account_name: '',
        account_number: '',
        qr_image: '',
        logo: '',
        description: '',
        is_active: true,
      });
    }
    setShowPaymentForm(true);
  };

  const closePaymentForm = () => {
    setShowPaymentForm(false);
    setSelectedPayment(null);
    setPaymentForm({
      type: 'bank_transfer',
      method_name: '',
      account_name: '',
      account_number: '',
      qr_image: '',
      logo: '',
      description: '',
      is_active: true,
    });
  };

  const handlePaymentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPaymentLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/payment-methods/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.imagePath) {
        setPaymentForm((prev) => ({ ...prev, logo: data.imagePath }));
        showToast('Logo berhasil diunggah', 'success');
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch (error) {
      showToast('Error uploading logo', 'error');
    } finally {
      setUploadingPaymentLogo(false);
    }
  };

  const handlePaymentQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPaymentImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/payment-methods/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.imagePath) {
        setPaymentForm((prev) => ({ ...prev, qr_image: data.imagePath }));
        showToast('QR Code berhasil diunggah', 'success');
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch (error) {
      showToast('Error uploading QR Code', 'error');
    } finally {
      setUploadingPaymentImage(false);
    }
  };

  const executeSavePayment = async (payload: any) => {
    try {
      if (selectedPayment) {
        const response = await fetch(`/api/payment-methods/${selectedPayment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          showToast('Metode pembayaran berhasil diperbarui', 'success');
          closePaymentForm();
          fetchPaymentMethods();
        } else {
          const errorData = await response.json().catch(() => ({}));
          showToast(errorData.error || 'Gagal memperbarui metode pembayaran', 'error');
        }
      } else {
        const response = await fetch('/api/payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          showToast('Metode pembayaran berhasil ditambahkan', 'success');
          closePaymentForm();
          fetchPaymentMethods();
        } else {
          const errorData = await response.json().catch(() => ({}));
          showToast(errorData.error || 'Gagal menambahkan metode pembayaran', 'error');
        }
      }
    } catch (error) {
      showToast('Terjadi kesalahan saat menyimpan metode pembayaran', 'error');
    }
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.method_name) {
      showToast('Nama metode pembayaran wajib diisi', 'error');
      return;
    }

    const payload = {
      type: paymentForm.type,
      method_name: paymentForm.method_name,
      account_name: paymentForm.type === 'cod' || paymentForm.type === 'qris' ? null : paymentForm.account_name || null,
      account_number: paymentForm.type === 'cod' || paymentForm.type === 'qris' ? null : paymentForm.account_number || null,
      qr_image: paymentForm.type === 'qris' ? paymentForm.qr_image || null : null,
      logo: paymentForm.logo || null,
      description: paymentForm.description || null,
      is_active: paymentForm.is_active ? 1 : 0,
    };

    setConfirmDialog({
      isOpen: true,
      title: selectedPayment ? 'Simpan Metode Pembayaran' : 'Tambah Metode Pembayaran',
      message: selectedPayment
        ? `Apakah Anda yakin ingin memperbarui metode pembayaran "${paymentForm.method_name}"?`
        : `Apakah Anda yakin ingin menambahkan metode pembayaran baru "${paymentForm.method_name}"?`,
      confirmText: 'Ya, Simpan',
      type: 'success',
      onConfirm: () => executeSavePayment(payload)
    });
  };

  const executeDeletePayment = async (id: number) => {
    try {
      const response = await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' });
      if (response.ok) {
        showToast('Metode pembayaran berhasil dihapus', 'success');
        fetchPaymentMethods();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || 'Gagal menghapus metode pembayaran', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan saat menghapus metode pembayaran', 'error');
    }
  };

  const handleDeletePayment = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Metode Pembayaran',
      message: `Apakah Anda yakin ingin menghapus metode pembayaran "${name}"? Tindakan ini permanen.`,
      onConfirm: () => executeDeletePayment(id)
    });
  };

  const handlePaymentStatusToggle = async (payment: PaymentMethod) => {
    const newStatus = payment.is_active === 1 ? 0 : 1;
    try {
      const response = await fetch(`/api/payment-methods/${payment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: newStatus
        }),
      });
      if (response.ok) {
        showToast(`Metode pembayaran ${newStatus === 1 ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
        fetchPaymentMethods();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || 'Gagal mengubah status', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan saat mengubah status', 'error');
    }
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

  const executeSaveProduct = async (payload: any) => {
    setSavingProduct(true);
    try {
      if (selectedProduct) {
        const response = await fetch(`/api/products/${selectedProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          showToast('Produk berhasil diperbarui', 'success');
          closeProductForm();
          fetchProducts();
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.details 
            ? `${errorData.error || 'Gagal memperbarui produk'}: ${errorData.details}` 
            : (errorData.error || 'Gagal memperbarui produk');
          showToast(errorMsg, 'error');
        }
      } else {
        const response = await fetch('/api/products/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          showToast('Produk berhasil dibuat', 'success');
          closeProductForm();
          fetchProducts();
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.details 
            ? `${errorData.error || 'Gagal membuat produk'}: ${errorData.details}` 
            : (errorData.error || 'Gagal membuat produk');
          showToast(errorMsg, 'error');
        }
      }
    } catch (error) {
      showToast('Terjadi kesalahan jaringan saat menyimpan produk', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || productForm.stock === '') {
      showToast('Silakan isi semua field wajib (*)', 'error');
      return;
    }

    const price = parseFloat(productForm.price);
    const stock = parseInt(productForm.stock);

    if (isNaN(price) || price < 0) {
      showToast('Harga tidak boleh bernilai negatif', 'error');
      return;
    }

    if (isNaN(stock) || stock < 0) {
      showToast('Stok tidak boleh bernilai negatif', 'error');
      return;
    }

    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: price,
      image_url: productForm.image_url,
      stock: stock,
      category_id: productForm.category_id ? parseInt(productForm.category_id) : null,
    };

    setConfirmDialog({
      isOpen: true,
      title: selectedProduct ? 'Simpan Perubahan' : 'Tambah Produk Baru',
      message: selectedProduct 
        ? `Apakah Anda yakin ingin memperbarui produk "${productForm.name}"?` 
        : `Apakah Anda yakin ingin menambahkan produk baru "${productForm.name}"?`,
      confirmText: 'Ya, Simpan',
      type: 'success',
      onConfirm: () => executeSaveProduct(payload)
    });
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
              <div className={`absolute top-0 left-0 w-full h-1 ${confirmDialog.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
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
                  className={`px-4 py-2 text-white font-bold rounded-lg transition-all cursor-pointer ${
                    confirmDialog.type === 'success'
                      ? 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                      : 'bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]'
                  }`}
                >
                  {confirmDialog.confirmText || (confirmDialog.type === 'success' ? 'Ya, Simpan' : 'Ya, Hapus')}
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

          {/* Low Stock Alerts Banner */}
          {(() => {
            const lowStockProducts = products.filter(p => p.stock <= 3);
            if (lowStockProducts.length === 0) return null;
            return (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="font-bold text-amber-500">Pemberitahuan Stok Menipis/Habis!</h3>
                    <p className="text-xs text-white/70">
                      Ada {lowStockProducts.length} produk yang stoknya hampir habis atau habis. Segera lakukan restok produk berikut.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lowStockProducts.slice(0, 3).map(p => (
                    <span
                      key={p.id}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        p.stock === 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {p.name} ({p.stock === 0 ? 'Habis' : `Sisa ${p.stock}`})
                    </span>
                  ))}
                  {lowStockProducts.length > 3 && (
                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white/60">
                      +{lowStockProducts.length - 3} lainnya
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })()}

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
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-6 py-3 font-bold transition-all ${
                activeTab === 'logs'
                  ? 'border-b-2 border-emerald-500 text-emerald-500'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Inventory Logs
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-3 font-bold transition-all ${
                activeTab === 'payments'
                  ? 'border-b-2 border-emerald-500 text-emerald-500'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Payment Methods
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
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 mt-3 shadow-inner">
                              <p className="text-white/80 text-sm mb-3 font-bold flex items-center gap-2">
                                📸 Bukti Pembayaran
                              </p>
                              
                              <div className="grid grid-cols-2 gap-4 mb-4 bg-black/20 p-3 rounded-lg">
                                <div>
                                  <p className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">Waktu Upload</p>
                                  <p className="text-emerald-400 text-xs mt-1 font-mono">{selectedOrder.payment_uploaded_at ? new Date(selectedOrder.payment_uploaded_at).toLocaleString() : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">Waktu Verifikasi</p>
                                  <p className="text-emerald-400 text-xs mt-1 font-mono">{selectedOrder.payment_verified_at ? new Date(selectedOrder.payment_verified_at).toLocaleString() : '-'}</p>
                                </div>
                              </div>

                              <div 
                                className="relative group cursor-zoom-in overflow-hidden rounded-xl border-2 border-emerald-500/20 hover:border-emerald-500/60 transition-all duration-300 w-full sm:max-w-[240px] shadow-lg"
                                onClick={() => setIsProofZoomed(true)}
                              >
                                <img
                                  src={selectedOrder.payment_proof_url}
                                  alt="Payment proof"
                                  className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-110 max-h-56"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 flex items-end justify-center pb-4 transition-opacity duration-300">
                                  <span className="text-white text-sm font-bold bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20 shadow-xl">
                                    🔍 Klik untuk Perbesar
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}


                        </div>
                      </div>

                      {/* Order Items */}
                      {selectedOrder.items && selectedOrder.items.length > 0 && (
                        <div className="border-t border-white/20 pt-4 mt-4">
                          <p className="text-white/80 text-sm mb-3 font-bold flex items-center gap-2">🛒 Daftar Pesanan</p>
                          <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5 shadow-inner">
                            {selectedOrder.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                <div className="flex flex-col">
                                  <span className="text-white font-medium">{item.product_name}</span>
                                  <span className="text-white/40 text-xs mt-0.5">{item.quantity} x {formatCurrency(parseFloat(String(item.price)) / item.quantity)}</span>
                                </div>
                                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">{formatCurrency(parseFloat(String(item.price)))}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-white/10">
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.id)}
                        disabled={isUpdating || !newStatus}
                        className="flex-1 py-2.5 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                      >
                        {isUpdating ? 'Menyimpan...' : 'Update Status'}
                      </button>
                      <button
                        onClick={() => deleteOrder(selectedOrder.id)}
                        disabled={loading}
                        className="flex-1 py-2.5 bg-red-500/20 text-red-500 font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30"
                      >
                        {loading ? 'Menghapus...' : 'Hapus Order'}
                      </button>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="flex-1 py-2.5 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-all"
                      >
                        Tutup
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
                                {product.stock === 0 ? (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                    Out of Stock
                                  </span>
                                ) : product.stock <= 3 ? (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    Sisa {product.stock} lagi!
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    {product.stock} pcs
                                  </span>
                                )}
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
                          disabled={savingProduct}
                          className="w-full px-4 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none disabled:opacity-50"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-bold mb-2">Description</label>
                        <textarea
                          name="description"
                          value={productForm.description}
                          onChange={handleProductFormChange}
                          disabled={savingProduct}
                          rows={2}
                          className="w-full px-4 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-bold mb-2">Category</label>
                        <select
                          name="category_id"
                          value={productForm.category_id}
                          onChange={handleProductFormChange}
                          disabled={savingProduct}
                          className="w-full px-4 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none disabled:opacity-50 [&>option]:bg-neutral-900 [&>option]:text-white"
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
                          disabled={savingProduct}
                          className="w-full px-4 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none disabled:opacity-50"
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
                          <label className={`flex items-center justify-center px-4 py-3 bg-white/10 text-white rounded border-2 border-dashed border-white/20 hover:border-emerald-500 cursor-pointer transition-all ${savingProduct ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <span className="text-sm font-semibold">
                              {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploadingImage || savingProduct}
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
                          disabled={savingProduct}
                          className="w-full px-4 py-2 bg-white/10 text-white rounded border border-white/20 focus:border-emerald-500 outline-none disabled:opacity-50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <button
                          type="submit"
                          disabled={savingProduct}
                          className="w-full py-2 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {savingProduct ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Menyimpan...</span>
                            </>
                          ) : (
                            <span>{selectedProduct ? 'Update' : 'Create'}</span>
                          )}
                        </button>
                        {selectedProduct && (
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(selectedProduct.id)}
                            disabled={savingProduct}
                            className="w-full py-2 bg-red-500 text-white font-bold rounded hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={closeProductForm}
                          disabled={savingProduct}
                          className="w-full py-2 bg-white/10 text-white font-bold rounded hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* INVENTORY LOGS TAB */}
          {activeTab === 'logs' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-lg p-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Inventory Logs</h2>
                  <p className="text-sm text-white/50 mt-1">
                    Riwayat pergerakan stok, restock manual, penjualan, dan pembatalan pesanan.
                  </p>
                </div>
                <button
                  onClick={fetchInventoryLogs}
                  className="px-4 py-2 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-600 transition-all cursor-pointer"
                >
                  Refresh Logs
                </button>
              </div>

              {loadingLogs ? (
                <p className="text-white/60">Loading logs...</p>
              ) : !inventoryLogs || inventoryLogs.length === 0 ? (
                <p className="text-white/60 text-center py-8">Belum ada riwayat log pergerakan stok.</p>
              ) : (
                <div className="space-y-4 overflow-x-auto">
                  <table className="w-full text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-white/10 text-left">
                        <th className="py-3 px-4 text-white/50 font-medium">Waktu</th>
                        <th className="py-3 px-4 text-white/50 font-medium">Produk</th>
                        <th className="py-3 px-4 text-white/50 font-medium">Tipe Perubahan</th>
                        <th className="py-3 px-4 text-white/50 font-medium text-center">Jumlah</th>
                        <th className="py-3 px-4 text-white/50 font-medium text-center">Stok Sebelum</th>
                        <th className="py-3 px-4 text-white/50 font-medium text-center">Stok Sesudah</th>
                        <th className="py-3 px-4 text-white/50 font-medium">Oleh / Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryLogs.map((log) => {
                        let badgeColor = 'bg-white/10 text-white';
                        let changeText = '';
                        if (log.change_type === 'sale') {
                          badgeColor = 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
                          changeText = 'Penjualan';
                        } else if (log.change_type === 'cancellation') {
                          badgeColor = 'bg-red-500/20 text-red-400 border border-red-500/30';
                          changeText = 'Pembatalan';
                        } else if (log.change_type === 'restock') {
                          badgeColor = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                          changeText = 'Restock';
                        } else if (log.change_type === 'adjustment') {
                          badgeColor = 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
                          changeText = 'Penyesuaian';
                        } else if (log.change_type === 'refund') {
                          badgeColor = 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
                          changeText = 'Refund';
                        }

                        return (
                          <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 text-white/50 text-xs">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-bold">{log.product_name || `Produk #${log.product_id}`}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${badgeColor}`}>
                                {changeText}
                              </span>
                            </td>
                            <td className={`py-3 px-4 text-center font-bold ${log.quantity_changed > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {log.quantity_changed > 0 ? `+${log.quantity_changed}` : log.quantity_changed}
                            </td>
                            <td className="py-3 px-4 text-center text-white/60">{log.stock_before}</td>
                            <td className="py-3 px-4 text-center font-bold text-white">{log.stock_after}</td>
                            <td className="py-3 px-4 text-xs whitespace-normal max-w-xs">
                              <span className="text-white/80 font-semibold">{log.user_name ? `${log.user_name} | ` : ''}</span>
                              <span className="text-white/60 italic">{log.notes || '-'}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2">
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                      <h2 className="text-2xl font-bold">Payment Methods</h2>
                      <p className="text-sm text-white/50 mt-1">
                        Kelola metode pembayaran otomatis yang aktif pada saat checkout pelanggan.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openPaymentForm()}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition-all"
                      >
                        + Add Payment
                      </button>
                      <button
                        onClick={fetchPaymentMethods}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-all"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  {loadingPayments ? (
                    <p className="text-white/60">Loading payment methods...</p>
                  ) : !paymentMethods || paymentMethods.length === 0 ? (
                    <p className="text-white/60 text-center py-8">Belum ada metode pembayaran yang terdaftar.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {paymentMethods.map((payment) => (
                        <div
                          key={payment.id}
                          className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-5 flex flex-col justify-between transition-all"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                {payment.logo ? (
                                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1.5 overflow-hidden">
                                    <img
                                      src={payment.logo}
                                      alt={payment.method_name}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-xl font-bold">
                                    💳
                                  </div>
                                )}
                                <div>
                                  <h3 className="font-bold text-lg text-white">{payment.method_name}</h3>
                                  <span className="text-xs uppercase bg-white/10 px-2 py-0.5 rounded text-white/70">
                                    {payment.type === 'bank_transfer'
                                      ? 'Bank Transfer'
                                      : payment.type === 'ewallet'
                                      ? 'E-Wallet'
                                      : payment.type === 'qris'
                                      ? 'QRIS Code'
                                      : 'Bayar Di Tempat (COD)'}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handlePaymentStatusToggle(payment)}
                                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                                  payment.is_active === 1
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}
                              >
                                {payment.is_active === 1 ? '● Aktif' : '○ Nonaktif'}
                              </button>
                            </div>

                            {payment.type !== 'cod' && payment.type !== 'qris' && (
                              <div className="space-y-1.5 bg-black/30 border border-white/5 rounded-xl p-3 mb-4 text-sm">
                                <p className="text-white/40 text-xs uppercase font-semibold tracking-wider">Informasi Rekening</p>
                                <p className="text-white/80 font-bold">{payment.account_number}</p>
                                <p className="text-white/60 text-xs">a.n. {payment.account_name}</p>
                              </div>
                            )}

                            {payment.type === 'qris' && (
                              <div className="space-y-1.5 bg-black/30 border border-white/5 rounded-xl p-3 mb-4 text-sm flex items-center justify-between">
                                <div>
                                  <p className="text-white/40 text-xs uppercase font-semibold tracking-wider">Auto QRIS</p>
                                  <p className="text-white/80 font-bold text-xs mt-1">Metode scan otomatis</p>
                                </div>
                                {payment.qr_image ? (
                                  <img
                                    src={payment.qr_image}
                                    alt="QRIS"
                                    className="w-10 h-10 object-contain rounded border border-white/10"
                                  />
                                ) : (
                                  <span className="text-red-400 text-xs">QR Belum Ada</span>
                                )}
                              </div>
                            )}

                            {payment.description && (
                              <p className="text-white/60 text-xs mb-4 italic line-clamp-2">
                                "{payment.description}"
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 border-t border-white/5 pt-4">
                            <button
                              onClick={() => openPaymentForm(payment)}
                              className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-lg transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePayment(payment.id, payment.method_name)}
                              className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold rounded-lg transition-all"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                {showPaymentForm ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-[#111111] border border-white/10 rounded-2xl p-6 static lg:sticky top-32"
                  >
                    <h3 className="text-xl font-bold mb-6 text-emerald-400">
                      {selectedPayment ? 'Edit Payment Method' : 'Add Payment Method'}
                    </h3>
                    <form onSubmit={handleSavePayment} className="space-y-4">
                      <div>
                        <label className="block text-white text-sm font-bold mb-2">Tipe Pembayaran *</label>
                        <select
                          name="type"
                          value={paymentForm.type}
                          onChange={handlePaymentFormChange}
                          className="w-full px-4 py-2.5 bg-white/5 text-white rounded-xl border border-white/10 focus:border-emerald-500 outline-none [&>option]:bg-neutral-900 [&>option]:text-white"
                        >
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="ewallet">E-Wallet</option>
                          <option value="qris">QRIS Code</option>
                          <option value="cod">Bayar di Tempat (COD)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-white text-sm font-bold mb-2">Nama Metode Pembayaran *</label>
                        <input
                          type="text"
                          name="method_name"
                          value={paymentForm.method_name}
                          onChange={handlePaymentFormChange}
                          placeholder="Contoh: Bank BCA, Dana, QRIS All Payment"
                          className="w-full px-4 py-2.5 bg-white/5 text-white rounded-xl border border-white/10 focus:border-emerald-500 outline-none placeholder-white/30"
                          required
                        />
                      </div>

                      {paymentForm.type !== 'cod' && paymentForm.type !== 'qris' && (
                        <>
                          <div>
                            <label className="block text-white text-sm font-bold mb-2">Nama Pemilik Akun / Rekening *</label>
                            <input
                              type="text"
                              name="account_name"
                              value={paymentForm.account_name}
                              onChange={handlePaymentFormChange}
                              placeholder="Nama pemilik rekening"
                              className="w-full px-4 py-2.5 bg-white/5 text-white rounded-xl border border-white/10 focus:border-emerald-500 outline-none placeholder-white/30"
                              required={paymentForm.type !== 'cod' && paymentForm.type !== 'qris'}
                            />
                          </div>
                          <div>
                            <label className="block text-white text-sm font-bold mb-2">Nomor Rekening / HP Akun *</label>
                            <input
                              type="text"
                              name="account_number"
                              value={paymentForm.account_number}
                              onChange={handlePaymentFormChange}
                              placeholder="Nomor rekening bank atau nomor HP e-wallet"
                              className="w-full px-4 py-2.5 bg-white/5 text-white rounded-xl border border-white/10 focus:border-emerald-500 outline-none placeholder-white/30 tracking-wider"
                              required={paymentForm.type !== 'cod' && paymentForm.type !== 'qris'}
                            />
                          </div>
                        </>
                      )}

                      {paymentForm.type === 'qris' && (
                        <div>
                          <label className="block text-white text-sm font-bold mb-2">Upload QRIS Code Image *</label>
                          <div className="space-y-3">
                            {paymentForm.qr_image && (
                              <div className="relative w-full h-36 bg-white/10 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-white/10">
                                <img
                                  src={paymentForm.qr_image}
                                  alt="QRIS Preview"
                                  className="h-full object-contain"
                                />
                              </div>
                            )}
                            <label className="flex items-center justify-center px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border-2 border-dashed border-white/15 hover:border-emerald-500 cursor-pointer transition-all">
                              <span className="text-sm font-semibold">
                                {uploadingPaymentImage ? 'Mengunggah...' : 'Pilih Foto QR Code'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handlePaymentQRUpload}
                                disabled={uploadingPaymentImage}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-white text-sm font-bold mb-2">Logo Metode Pembayaran</label>
                        <div className="space-y-3">
                          {paymentForm.logo && (
                            <div className="relative w-16 h-16 bg-white rounded-xl overflow-hidden flex items-center justify-center p-2 border border-white/10">
                              <img
                                src={paymentForm.logo}
                                alt="Logo Preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          <label className="flex items-center justify-center px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border-2 border-dashed border-white/15 hover:border-emerald-500 cursor-pointer transition-all">
                            <span className="text-sm font-semibold">
                              {uploadingPaymentLogo ? 'Mengunggah...' : 'Pilih Logo'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePaymentLogoUpload}
                              disabled={uploadingPaymentLogo}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-white text-sm font-bold mb-2">Deskripsi / Petunjuk Transfer</label>
                        <textarea
                          name="description"
                          value={paymentForm.description}
                          onChange={handlePaymentFormChange}
                          rows={3}
                          placeholder="Masukkan petunjuk pembayaran khusus untuk pelanggan..."
                          className="w-full px-4 py-2.5 bg-white/5 text-white rounded-xl border border-white/10 focus:border-emerald-500 outline-none placeholder-white/30"
                        />
                      </div>

                      <div className="flex items-center gap-3 py-2">
                        <input
                          type="checkbox"
                          id="is_active"
                          name="is_active"
                          checked={paymentForm.is_active}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="w-5 h-5 rounded border-white/10 bg-white/5 text-emerald-500 focus:ring-emerald-500 outline-none"
                        />
                        <label htmlFor="is_active" className="text-sm font-bold text-white select-none cursor-pointer">
                          Metode Pembayaran Aktif
                        </label>
                      </div>

                      <div className="space-y-2 pt-4">
                        <button
                          type="submit"
                          className="w-full py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={closePaymentForm}
                          className="w-full py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-[#111111] border border-white/10 rounded-2xl p-6 static lg:sticky top-32 text-center text-white/60"
                  >
                    <p>Pilih atau tambahkan metode pembayaran untuk mengelola detailnya.</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Proof Zoom Modal */}
      {isProofZoomed && selectedOrder && selectedOrder.payment_proof_url && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 transition-all duration-300 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setIsProofZoomed(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white p-4 rounded-2xl max-w-2xl w-full border border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-black font-bold text-lg">Bukti Pembayaran - Order #{selectedOrder.id}</h4>
              <button onClick={() => setIsProofZoomed(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">✕</button>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 flex justify-center">
              <img src={selectedOrder.payment_proof_url} alt="Zoomed Proof" className="max-w-full h-auto max-h-[75vh] object-contain" />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
