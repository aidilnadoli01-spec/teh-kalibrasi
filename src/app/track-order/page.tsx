'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  payment_method_id?: number | null;
  payment_method_name?: string | null;
  payment_method_details?: {
    id: number;
    type: 'bank_transfer' | 'ewallet' | 'qris' | 'cod';
    method_name: string;
    logo_url: string | null;
    account_number: string | null;
    account_name: string | null;
    qr_code_url: string | null;
    is_active: number;
    description: string | null;
  } | null;
}

function CopyButton({ text, label = 'Salin' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 px-3 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 rounded border border-emerald-500/30 transition-all flex items-center gap-1 active:scale-95"
    >
      <span>{copied ? '✓' : '📋'}</span>
      <span>{copied ? 'Tersalin!' : label}</span>
    </button>
  );
}

export default function TrackOrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofMessage, setProofMessage] = useState('');
  const [isQrZoomed, setIsQrZoomed] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/orders/user');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data);
      
      if (selectedOrder) {
        const updatedSelected = data.find((o: Order) => o.id === selectedOrder.id);
        if (updatedSelected) setSelectedOrder(updatedSelected);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedOrder]);

  // Initial fetch
  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, fetchOrders]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
    setProofMessage('');
  };

  const submitPaymentProof = async () => {
    if (!selectedOrder || !selectedFile) return;

    setUploadingProof(true);
    setProofMessage('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('orderId', String(selectedOrder.id));

    try {
      const uploadResponse = await fetch('/api/payment-proof', {
        method: 'POST',
        body: formData,
      });

      const data = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(data.error || 'Failed to upload payment proof');
      }

      setProofMessage('Payment proof uploaded successfully! Admin will verify it soon.');
      setSelectedFile(null);
      setPreviewImage(null);
      
      // Update local state directly so UI responds immediately
      setSelectedOrder({ ...selectedOrder, payment_status: 'pending', payment_proof_url: data.imagePath });
      
      await new Promise(r => setTimeout(r, 1000));
      fetchOrders();
    } catch (err) {
      setProofMessage(err instanceof Error ? err.message : 'Failed to upload payment proof');
    } finally {
      setUploadingProof(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-500';
      case 'processing': return 'bg-blue-500/20 text-blue-500';
      case 'ready': return 'bg-purple-500/20 text-purple-500';
      case 'completed': return 'bg-green-500/20 text-green-500';
      case 'cancelled': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid': return 'bg-red-500/20 text-red-500';
      case 'pending': return 'bg-yellow-500/20 text-yellow-500';
      case 'verified': return 'bg-green-500/20 text-green-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getPaymentMethodLabel = (order: Order) => {
    if (order.payment_method_name) return order.payment_method_name;
    switch (order.payment_method) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'ewallet': return 'E-Wallet';
      case 'cod': return 'Bayar di Tempat (Pickup)';
      default: return order.payment_method;
    }
  };

  const filteredOrders = orders.filter(o => filterStatus === 'all' || o.status === filterStatus);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 md:px-8 flex-1 flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Orders</h1>
            <p className="text-white/60">Manage and track your orders securely</p>
          </motion.div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded text-red-500">
              {error}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6 flex-1 h-full min-h-[600px]">
            {/* Left Column: Order List */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full lg:w-1/3 flex flex-col gap-4"
            >
              <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-4 h-full flex flex-col">
                <h2 className="text-lg font-bold text-white mb-4">Your Orders</h2>
                
                {/* Filters */}
                <div className="flex overflow-x-auto pb-2 mb-4 gap-2 no-scrollbar">
                  {['all', 'pending', 'processing', 'ready', 'completed', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                        filterStatus === status 
                          ? 'bg-emerald-500 text-black border-emerald-500' 
                          : 'bg-white/5 text-white/60 border-white/10 hover:border-emerald-500/50 hover:text-white'
                      }`}
                    >
                      {status === 'all' ? 'All Orders' : status.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* List */}
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {loading && orders.length === 0 ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8 px-4 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-white/40 text-sm">No orders found.</p>
                    </div>
                  ) : (
                    filteredOrders.map((o) => (
                      <div 
                        key={o.id}
                        onClick={() => {
                          setSelectedOrder(o);
                          setProofMessage('');
                          setPreviewImage(null);
                          setSelectedFile(null);
                        }}
                        className={`p-4 rounded-lg cursor-pointer border transition-all ${
                          selectedOrder?.id === o.id 
                            ? 'bg-emerald-500/10 border-emerald-500' 
                            : 'bg-black/40 border-white/10 hover:border-emerald-500/50 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-white font-bold text-sm">Order #{o.id}</p>
                            <p className="text-white/40 text-xs">{new Date(o.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(o.status)}`}>
                            {o.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between items-end mt-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPaymentStatusColor(o.payment_status)}`}>
                            Payment: {o.payment_status.toUpperCase()}
                          </span>
                          <p className="text-emerald-400 font-bold text-sm">{formatCurrency(parseFloat(String(o.total_price)))}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right Column: Selected Order Details */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full lg:w-2/3 flex flex-col"
            >
              {!selectedOrder ? (
                <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-12 h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Select an Order</h3>
                  <p className="text-white/60 max-w-md">Choose an order from the list to view its complete details, track status, and manage payments.</p>
                </div>
              ) : (
                <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar h-full">
                  {/* Order Header */}
                  <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                      <div>
                        <p className="text-white/60 text-sm mb-1">Order Details</p>
                        <h2 className="text-2xl md:text-3xl font-bold text-white">#{selectedOrder.id}</h2>
                      </div>
                      <div className="flex gap-2">
                         <button
                          onClick={fetchOrders}
                          className="px-4 py-2 text-sm bg-emerald-500/20 text-emerald-500 rounded hover:bg-emerald-500/30 transition-all font-semibold flex items-center gap-2"
                        >
                          🔄 Refresh
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
                      <div>
                        <p className="text-white/60 text-xs mb-1">Date</p>
                        <p className="text-white font-semibold text-sm">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-xs mb-1">Order Status</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white/60 text-xs mb-1">Payment Method</p>
                        <p className="text-white font-semibold text-sm truncate">{getPaymentMethodLabel(selectedOrder)}</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-xs mb-1">Payment Status</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                          {selectedOrder.payment_status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Customer Info</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-white/40 text-xs">Name</p>
                          <p className="text-white font-medium text-sm">{selectedOrder.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Email</p>
                          <p className="text-white text-sm break-all">{selectedOrder.customer_email}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Phone</p>
                          <p className="text-white text-sm">{selectedOrder.customer_phone || '-'}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Pickup Location / Notes</p>
                          <p className="text-white text-sm">{selectedOrder.customer_address || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-6 flex flex-col">
                      <h3 className="text-lg font-bold text-white mb-4">Items</h3>
                      <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                          selectedOrder.items.map((item: any, index) => (
                            <div key={index} className="flex justify-between items-center pb-2 border-b border-white/5 last:border-0">
                              <div>
                                <p className="text-white font-medium text-sm">{item.product_name || 'Product'}</p>
                                <p className="text-white/40 text-xs">Qty: {item.quantity}</p>
                              </div>
                              <p className="text-white font-bold text-sm">{formatCurrency(parseFloat(String(item.price)))}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-white/40 text-sm">No items found</p>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                        <span className="text-white/60 font-semibold text-sm">Total</span>
                        <span className="text-emerald-500 font-bold text-lg">{formatCurrency(parseFloat(String(selectedOrder.total_price)))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Action Section */}
                  <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-bold text-white mb-4">Payment Instructions</h3>
                    
                    {/* Dynamic Payment Method Details */}
                    {selectedOrder.payment_method_details ? (
                      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-5 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                          {selectedOrder.payment_method_details.logo_url ? (
                            <img
                              src={selectedOrder.payment_method_details.logo_url}
                              alt={selectedOrder.payment_method_details.method_name}
                              className="h-8 object-contain rounded bg-white/10 p-1"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-400 text-sm">
                              {selectedOrder.payment_method_details.method_name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-white font-bold text-base leading-tight">
                              {selectedOrder.payment_method_details.method_name}
                            </p>
                            <p className="text-white/40 text-xs mt-0.5">
                              {selectedOrder.payment_method_details.type.replace('_', ' ').toUpperCase()}
                            </p>
                          </div>
                        </div>

                        {selectedOrder.payment_method_details.type === 'qris' && selectedOrder.payment_method_details.qr_code_url && (
                          <div className="flex flex-col items-center justify-center bg-black/40 rounded-lg p-4 border border-white/5 mb-4">
                            <p className="text-emerald-400 font-semibold text-sm mb-3">📸 Pindai Kode QRIS:</p>
                            <div 
                              className="relative group cursor-zoom-in overflow-hidden rounded-lg bg-white p-2 border border-emerald-500/30 hover:border-emerald-500 transition-all max-w-[200px]"
                              onClick={() => setIsQrZoomed(true)}
                            >
                              <img
                                src={selectedOrder.payment_method_details.qr_code_url}
                                alt="QRIS Code"
                                className="w-full h-auto object-contain transition-transform group-hover:scale-105"
                              />
                            </div>
                            <p className="text-white/60 text-xs text-center mt-3 max-w-sm">
                              {selectedOrder.payment_method_details.description || 'Pindai kode QR menggunakan aplikasi e-wallet / m-banking Anda.'}
                            </p>
                          </div>
                        )}

                        {(selectedOrder.payment_method_details.type === 'bank_transfer' || selectedOrder.payment_method_details.type === 'ewallet') && (
                          <div className="space-y-4 bg-black/40 rounded-lg p-4 border border-white/5 mb-4">
                            {selectedOrder.payment_method_details.account_name && (
                              <div>
                                <p className="text-white/40 text-xs">Atas Nama</p>
                                <p className="text-white font-semibold text-sm mt-0.5">{selectedOrder.payment_method_details.account_name}</p>
                              </div>
                            )}
                            {selectedOrder.payment_method_details.account_number && (
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-white/40 text-xs">No. Rekening / Akun</p>
                                  <p className="text-emerald-400 font-bold text-lg tracking-wider mt-0.5">
                                    {selectedOrder.payment_method_details.account_number}
                                  </p>
                                </div>
                                <CopyButton text={selectedOrder.payment_method_details.account_number} label="Salin" />
                              </div>
                            )}
                            {selectedOrder.payment_method_details.description && (
                              <div className="pt-2 border-t border-white/5">
                                <p className="text-white/60 text-xs">{selectedOrder.payment_method_details.description}</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {selectedOrder.payment_method_details.type === 'cod' && (
                           <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center mb-4">
                             <p className="text-emerald-400 font-bold text-sm mb-1">🤝 Pembayaran Cash on Delivery (COD)</p>
                             <p className="text-white/60 text-xs max-w-sm mx-auto">
                               {selectedOrder.payment_method_details.description || 'Silakan siapkan uang tunai sesuai total tagihan.'}
                             </p>
                           </div>
                        )}
                      </div>
                    ) : (
                      selectedOrder.payment_method === 'bank_transfer' && (selectedOrder.bank_name || selectedOrder.bank_account_name || selectedOrder.bank_account_number) && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                          <p className="text-blue-500 font-bold text-sm mb-3">💳 Rekening Tujuan:</p>
                          <div className="space-y-2">
                            {selectedOrder.bank_name && (
                              <div><p className="text-white/60 text-xs">Bank</p><p className="text-white font-bold">{selectedOrder.bank_name}</p></div>
                            )}
                            {selectedOrder.bank_account_number && (
                              <div className="flex justify-between items-center">
                                <div><p className="text-white/60 text-xs">No. Rekening</p><p className="text-white font-bold text-lg tracking-wider">{selectedOrder.bank_account_number}</p></div>
                                <CopyButton text={selectedOrder.bank_account_number} label="Salin" />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )}

                    {/* Payment Proof Section */}
                    {selectedOrder.payment_status === 'verified' ? (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">✓</div>
                        <div>
                          <p className="text-green-500 font-bold">Payment Verified</p>
                          <p className="text-green-500/60 text-xs">Your payment has been successfully verified.</p>
                        </div>
                      </div>
                    ) : !(selectedOrder.payment_method === 'cod' || selectedOrder.payment_method_details?.type === 'cod') ? (
                      <div>
                        <label className="block mb-4">
                          <span className="text-white/80 text-sm font-semibold mb-2 block">
                            {selectedOrder.payment_proof_url ? 'Update Payment Proof:' : 'Upload Payment Proof:'}
                          </span>
                          <input type="file" accept="image/jpeg, image/png, image/webp, image/gif" onChange={handleFileChange} disabled={uploadingProof} className="hidden" />
                          <div className="border-2 border-dashed border-emerald-500/50 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/5 transition-all">
                            <p className="text-white/60 text-sm">{uploadingProof ? 'Uploading...' : 'Click to select image (JPEG, PNG, WebP, GIF - Max 5MB)'}</p>
                          </div>
                        </label>
                        
                        {previewImage && (
                           <div className="mb-4 bg-black/40 p-4 rounded-lg border border-white/10">
                              <p className="text-white/60 text-xs mb-2">Image Preview:</p>
                              <img src={previewImage} alt="Preview" className="w-full max-w-sm rounded border border-white/20 mb-3" />
                              <button 
                                onClick={submitPaymentProof}
                                disabled={uploadingProof}
                                className="px-4 py-2 bg-emerald-500 text-black font-bold rounded text-sm hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center gap-2"
                              >
                                {uploadingProof ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span> : '📤'}
                                {uploadingProof ? 'Uploading...' : 'Upload Now'}
                              </button>
                           </div>
                        )}

                        {proofMessage && (
                          <div className={`p-3 rounded text-sm mb-4 ${proofMessage.includes('successfully') ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                            {proofMessage}
                          </div>
                        )}

                        {selectedOrder.payment_proof_url && !previewImage && (
                          <div>
                            <p className="text-white/60 text-sm mb-2">Uploaded Proof:</p>
                            <img src={selectedOrder.payment_proof_url} alt="Proof" className="w-full max-w-sm rounded border border-white/10" />
                          </div>
                        )}
                      </div>
                    ) : null}

                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {isQrZoomed && selectedOrder && selectedOrder.payment_method_details?.qr_code_url && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 transition-all duration-300 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setIsQrZoomed(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white p-4 rounded-2xl max-w-md w-full border border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-black font-bold text-lg">{selectedOrder.payment_method_details.method_name}</h4>
              <button onClick={() => setIsQrZoomed(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">✕</button>
            </div>
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <img src={selectedOrder.payment_method_details.qr_code_url} alt="QR" className="w-full h-auto object-contain max-h-[70vh]" />
            </div>
            <div className="text-center mt-4">
              <p className="text-emerald-600 font-bold text-sm mt-1">Total: {formatCurrency(parseFloat(String(selectedOrder.total_price)))}</p>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.4);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
