'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatCurrency } from '@/lib/currency';

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  total_price: number;
  status: string;
  payment_method: string;
  payment_status: string;
  payment_proof_url: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  created_at: string;
  items: any[];
}

export default function TrackOrderPage() {
  const [searchType, setSearchType] = useState<'id' | 'email'>('id');
  const [searchValue, setSearchValue] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofMessage, setProofMessage] = useState('');

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const response = await fetch(
        `/api/orders?search=${encodeURIComponent(searchValue)}&searchType=${searchType}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError('Order not found');
        } else {
          setError('Failed to find order');
        }
        return;
      }

      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!order || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    setUploadingProof(true);
    setProofMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('orderId', String(order.id));

    try {
      // Upload file to payment-proof endpoint
      const uploadResponse = await fetch('/api/payment-proof', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload payment proof');
      }

      const uploadData = await uploadResponse.json();

      // Update order with payment proof
      const updateResponse = await fetch(`/api/orders/${order.id}/payment-proof`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentProofUrl: uploadData.imagePath,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to save payment proof');
      }

      setProofMessage('Payment proof uploaded successfully! Admin will verify it soon.');
      // Refresh order data
      await new Promise(r => setTimeout(r, 1000));
      handleSearch(new Event('submit') as any);
    } catch (err) {
      setProofMessage(err instanceof Error ? err.message : 'Failed to upload payment proof');
    } finally {
      setUploadingProof(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'processing':
        return 'bg-blue-500/20 text-blue-500';
      case 'shipped':
        return 'bg-purple-500/20 text-purple-500';
      case 'delivered':
        return 'bg-green-500/20 text-green-500';
      case 'cancelled':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid':
        return 'bg-red-500/20 text-red-500';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'verified':
        return 'bg-green-500/20 text-green-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'ewallet':
        return 'E-Wallet';
      case 'cod':
        return 'Cash on Delivery';
      default:
        return method;
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="pt-20 pb-20 px-4 md:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Track Your Order</h1>
            <p className="text-white/60 text-lg">Enter your order ID or email to track your order and upload payment proof</p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-emerald-500/30 rounded-lg p-4 md:p-6 mb-8"
          >
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="id"
                    checked={searchType === 'id'}
                    onChange={(e) => setSearchType(e.target.value as 'id' | 'email')}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Search by Order ID</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="email"
                    checked={searchType === 'email'}
                    onChange={(e) => setSearchType(e.target.value as 'id' | 'email')}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Search by Email</span>
                </label>
              </div>

              <div>
                <input
                  type={searchType === 'id' ? 'number' : 'email'}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchType === 'id' ? 'Enter Order ID (e.g., 1)' : 'Enter Email Address'}
                  className="w-full px-4 py-3 bg-white/10 text-white rounded border border-gray-700 focus:border-emerald-500 placeholder-white/40 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-600 transition-all disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search Order'}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded text-red-500">
                {error}
              </div>
            )}
          </motion.div>

          {/* Order Details */}
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Order Header */}
              <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                  <div>
                    <p className="text-white/60 text-sm mb-1">Order ID</p>
                    <h2 className="text-2xl md:text-3xl font-bold text-white">#{order.id}</h2>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-white/60 text-sm mb-1">Order Date</p>
                    <p className="text-white font-bold">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                  <div>
                    <p className="text-white/60 text-sm mb-2">Order Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-2">Payment Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${getPaymentStatusColor(order.payment_status)}`}>
                      {order.payment_status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Customer Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-white/60 text-sm">Name</p>
                    <p className="text-white font-bold">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Email</p>
                    <p className="text-white break-all">{order.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Phone</p>
                    <p className="text-white">{order.customer_phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Address</p>
                    <p className="text-white">{order.customer_address}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Order Items</h3>
                <div className="space-y-3">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item: any, index) => (
                      <div key={index} className="flex justify-between items-center pb-3 border-b border-white/10 last:border-0">
                        <div>
                          <p className="text-white font-bold">{item.product_name || 'Unknown Product'}</p>
                          <p className="text-white/60 text-sm">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-white font-bold">{formatCurrency(parseFloat(String(item.price)))}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/60">No items found</p>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Payment Information</h3>
                  <button
                    onClick={() => handleSearch(new Event('submit') as any)}
                    className="px-3 py-1 text-xs bg-emerald-500/20 text-emerald-500 rounded hover:bg-emerald-500/30 transition-all"
                  >
                    🔄 Refresh
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center pb-3 border-b border-white/10 gap-1">
                    <span className="text-white/60">Payment Method:</span>
                    <span className="text-white font-bold">{getPaymentMethodLabel(order.payment_method)}</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center pb-3 border-b border-white/10 gap-1">
                    <span className="text-white/60">Total Amount:</span>
                    <span className="text-emerald-500 font-bold text-xl">{formatCurrency(parseFloat(String(order.total_price)))}</span>
                  </div>

                  {/* Bank Details for Bank Transfer */}
                  {order.payment_method === 'bank_transfer' && (order.bank_name || order.bank_account_name || order.bank_account_number) && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <p className="text-blue-500 font-bold text-sm mb-3">💳 Transfer ke Rekening Berikut:</p>
                      <div className="space-y-2">
                        {order.bank_name && (
                          <div>
                            <p className="text-white/60 text-xs">Bank</p>
                            <p className="text-white font-bold">{order.bank_name}</p>
                          </div>
                        )}
                        {order.bank_account_name && (
                          <div>
                            <p className="text-white/60 text-xs">Nama Rekening</p>
                            <p className="text-white font-bold">{order.bank_account_name}</p>
                          </div>
                        )}
                        {order.bank_account_number && (
                          <div>
                            <p className="text-white/60 text-xs">No. Rekening</p>
                            <p className="text-white font-bold text-lg tracking-wider">{order.bank_account_number}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Proof Upload */}
                  {order.payment_status !== 'verified' && order.payment_method !== 'cod' && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <p className="text-white text-sm mb-4">
                        {order.payment_proof_url ? 'Update your payment proof:' : 'Upload your payment proof:'}
                      </p>
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadProof}
                          disabled={uploadingProof}
                          className="hidden"
                        />
                        <div className="border-2 border-dashed border-emerald-500/50 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-500/80 hover:bg-emerald-500/5 transition-all">
                          <p className="text-white/60 text-sm">
                            {uploadingProof ? 'Uploading...' : 'Click to upload payment proof (JPEG, PNG, WebP, GIF - Max 5MB)'}
                          </p>
                        </div>
                      </label>

                      {proofMessage && (
                        <div className={`mt-4 p-4 rounded ${proofMessage.includes('successfully') ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {proofMessage}
                        </div>
                      )}

                      {order.payment_proof_url && (
                        <div className="mt-4">
                          <p className="text-white/60 text-sm mb-2">Current proof:</p>
                          <img 
                            src={order.payment_proof_url} 
                            alt="Payment proof" 
                            className="w-full h-auto rounded border border-emerald-500/30 max-h-96 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {order.payment_status === 'verified' && (
                    <div className="mt-6 pt-6 border-t border-white/10 bg-green-500/10 border-green-500/30 rounded p-4">
                      <p className="text-green-500 font-bold">✓ Payment Verified</p>
                      <p className="text-green-500/60 text-sm mt-1">Your payment has been verified by the admin</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
