'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatCurrency } from '@/lib/currency';
import { motion, AnimatePresence } from 'framer-motion';

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({isOpen: false, title: '', message: '', onConfirm: () => {}});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchWishlist();
    }
  }, [status, router]);

  const fetchWishlist = async () => {
    try {
      const res = await fetch('/api/wishlist');
      const data = await res.json();
      if (Array.isArray(data)) {
        setWishlistProducts(data);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeRemoveWishlist = async (productId: number) => {
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      if (res.ok) {
        setWishlistProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeWishlist = (productId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Wishlist',
      message: 'Kamu yakin ingin menghapus ini dari wishlist kamu?',
      onConfirm: () => executeRemoveWishlist(productId)
    });
  };

  if (status === 'loading' || loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
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

      <Navbar />
      <main className="pt-32 pb-20 container mx-auto px-6 max-w-5xl">
        <h1 className="text-4xl font-bold mb-2">My Wishlist</h1>
        <p className="text-white/60 mb-12">Your saved premium selections</p>

        {wishlistProducts.length === 0 ? (
          <div className="bg-white/5 p-12 rounded-lg text-center border border-white/10">
            <h3 className="text-2xl font-bold mb-4">Your Wishlist is Empty</h3>
            <p className="text-white/50 mb-6">Explore the collection and discover your favorite teas.</p>
            <button 
              onClick={() => router.push('/products')}
              className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-600 transition-all"
            >
              Browse Collection
            </button>
          </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-all group relative"
              >
                <button
                  onClick={() => removeWishlist(product.id)}
                  className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-red-500/50"
                  title="Remove from wishlist"
                >
                  ✕
                </button>
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{product.name}</h3>
                  <p className="text-emerald-500 font-bold mb-4">{formatCurrency(parseFloat(product.price))}</p>
                  <button
                     onClick={() => router.push('/products')}
                    className="w-full py-2 bg-white/10 text-white font-bold rounded hover:bg-emerald-500 hover:text-black transition-all"
                  >
                    View in Store
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
