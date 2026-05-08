'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductReviews, { StarRating } from '@/components/ProductReviews';
import { formatCurrency } from '@/lib/currency';
import { motion } from 'framer-motion';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  category_name?: string;
}

export default function ProductDetailPage() {
  const { id } = useParams() as { id: string };
  const { data: session } = useSession();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  // Quick avg for the product header (refreshed independently)
  const [headerAvg, setHeaderAvg] = useState({ avg: 0, total: 0 });

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchHeaderAvg();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      const found = Array.isArray(data)
        ? data.find((p: Product) => p.id === parseInt(id))
        : null;
      setProduct(found || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHeaderAvg = async () => {
    try {
      const res = await fetch(`/api/reviews?product_id=${id}`);
      const data = await res.json();
      if (data.avgRating !== undefined) {
        setHeaderAvg({ avg: data.avgRating, total: data.totalReviews });
      }
    } catch (err) {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <button
            onClick={() => router.push('/products')}
            className="text-emerald-500 hover:underline"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="pt-32 pb-20 container mx-auto px-6 max-w-5xl">

        {/* Back */}
        <button
          onClick={() => router.push('/products')}
          className="mb-8 text-white/50 hover:text-white text-sm flex items-center gap-2 transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Back to Store
        </button>

        {/* Product Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-4">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full rounded-2xl object-cover aspect-square border border-white/10"
              />
            ) : (
              <div className="w-full aspect-square bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                <span className="text-white/20 text-6xl">🍵</span>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-center"
          >
            {product.category_name && (
              <span className="inline-block mb-3 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-full w-fit border border-emerald-500/30">
                {product.category_name}
              </span>
            )}
            <h1 className="text-4xl font-bold mb-3">{product.name}</h1>

            {/* Avg Rating in header */}
            <div className="flex items-center gap-2 mb-5">
              <StarRating value={Math.round(headerAvg.avg)} size="sm" />
              <span className="text-white/40 text-sm">
                {headerAvg.total > 0
                  ? `${headerAvg.avg.toFixed(1)} / 5 · ${headerAvg.total} ulasan`
                  : 'Belum ada ulasan'}
              </span>
            </div>

            <p className="text-white/70 leading-relaxed mb-6">{product.description}</p>
            <p className="text-3xl font-bold text-emerald-500 mb-2">
              {formatCurrency(parseFloat(String(product.price)))}
            </p>
            <p className={`text-sm mb-8 font-medium ${product.stock > 0 ? 'text-white/40' : 'text-red-400'}`}>
              {product.stock > 0 ? `${product.stock} tersisa` : 'Stok habis'}
            </p>

            <button
              onClick={() => router.push('/products')}
              className="w-full py-3.5 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all"
            >
              Beli di Toko
            </button>
          </motion.div>
        </div>

        {/* ✅ Reviews Section — komponen terpisah */}
        <ProductReviews productId={parseInt(id)} />

      </main>
      <Footer />
    </div>
  );
}
