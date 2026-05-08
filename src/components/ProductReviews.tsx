'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Review {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface RatingDistribution {
  star: number;
  count: number;
}

interface ReviewsData {
  reviews: Review[];
  avgRating: number;
  totalReviews: number;
  distribution: RatingDistribution[];
}

// ─────────────────────────────────────────────
// Star Rating Component
// ─────────────────────────────────────────────
export function StarRating({
  value,
  onChange,
  size = 'md',
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hover, setHover] = useState(0);
  const sizeClass = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-4xl' : 'text-2xl';

  return (
    <div className="flex gap-0.5" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          disabled={!onChange}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          className={`${sizeClass} transition-all duration-150 ${
            star <= (hover || value)
              ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]'
              : 'text-white/15'
          } ${onChange ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Rating Bar (distribusi per bintang)
// ─────────────────────────────────────────────
function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-white/50 w-3 text-right">{star}</span>
      <span className="text-yellow-400 text-xs">★</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full bg-yellow-400 rounded-full"
        />
      </div>
      <span className="text-white/40 w-6 text-right text-xs">{count}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Review Card
// ─────────────────────────────────────────────
function ReviewCard({ review, index }: { review: Review; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        {/* Avatar + Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm uppercase flex-shrink-0">
            {review.user_name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-white leading-none">{review.user_name}</p>
            <p className="text-white/35 text-xs mt-0.5">
              {new Date(review.created_at).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        {/* Stars */}
        <StarRating value={review.rating} size="sm" />
      </div>

      {review.comment && (
        <p className="text-white/70 leading-relaxed text-sm pl-12">{review.comment}</p>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Review Form
// ─────────────────────────────────────────────
function ReviewForm({
  productId,
  onSuccess,
}: {
  productId: number;
  onSuccess: () => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const charMin = 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      router.push('/login');
      return;
    }

    // Client-side validation
    if (rating === 0) {
      setError('Pilih rating bintang terlebih dahulu.');
      return;
    }
    if (comment.trim().length === 0) {
      setError('Komentar tidak boleh kosong.');
      return;
    }
    if (comment.trim().length < charMin) {
      setError(`Komentar minimal ${charMin} karakter.`);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, rating, comment }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Gagal mengirim ulasan.');

      setSuccess(data.message || 'Ulasan berhasil dikirim!');
      setRating(0);
      setComment('');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="text-center py-6">
        <p className="text-white/50 mb-4 text-sm">Login untuk memberikan ulasan produk ini.</p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-2.5 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all text-sm"
        >
          Login Sekarang
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Star Picker */}
      <div>
        <label className="block text-white/50 text-xs uppercase tracking-widest mb-3">
          Rating kamu *
        </label>
        <div className="flex items-center gap-3">
          <StarRating value={rating} onChange={setRating} size="lg" />
          {rating > 0 && (
            <motion.span
              key={rating}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-yellow-400 font-bold text-lg"
            >
              {['', 'Buruk', 'Kurang', 'Cukup', 'Bagus', 'Luar Biasa!'][rating]}
            </motion.span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-white/50 text-xs uppercase tracking-widest mb-3">
          Ulasan kamu *
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Ceritakan pengalamanmu dengan teh ini... (min. 10 karakter)"
          className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl focus:border-emerald-500 focus:bg-white/[0.07] outline-none text-white resize-none transition-all placeholder:text-white/25 text-sm"
          maxLength={500}
        />
        <div className="flex justify-between mt-1.5">
          <span className={`text-xs ${comment.trim().length < charMin && comment.length > 0 ? 'text-red-400' : 'text-white/30'}`}>
            {comment.trim().length < charMin && comment.length > 0
              ? `Minimal ${charMin - comment.trim().length} karakter lagi`
              : `${comment.length}/500`}
          </span>
        </div>
      </div>

      {/* Error / Success */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
          >
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3"
          >
            <span className="text-base">✅</span>
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={submitting}
        className="px-8 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
      >
        {submitting ? (
          <>
            <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Mengirim...
          </>
        ) : (
          'Kirim Ulasan'
        )}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────
// Main ProductReviews Component (export default)
// ─────────────────────────────────────────────
export default function ProductReviews({ productId }: { productId: number }) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?product_id=${productId}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleReviewSuccess = () => {
    setShowForm(false);
    fetchReviews();
  };

  return (
    <section className="border-t border-white/10 pt-14 mt-14">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h2 className="text-2xl font-bold mb-1">Ulasan Pelanggan</h2>
          <p className="text-white/40 text-sm">
            {data?.totalReviews
              ? `${data.totalReviews} ulasan dari pelanggan yang sudah membeli`
              : 'Belum ada ulasan untuk produk ini'}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="self-start md:self-auto px-5 py-2.5 border border-emerald-500/50 text-emerald-400 font-bold rounded-xl hover:bg-emerald-500/10 transition-all text-sm flex items-center gap-2"
        >
          <span>{showForm ? '✕ Tutup Form' : '✏️ Tulis Ulasan'}</span>
        </button>
      </div>

      {/* Summary: avg + distribution */}
      {data && data.totalReviews > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-8"
        >
          {/* Big avg */}
          <div className="flex flex-col items-center justify-center md:border-r border-white/10 md:pr-8 text-center min-w-[120px]">
            <p className="text-6xl font-black text-white leading-none mb-2">
              {data.avgRating.toFixed(1)}
            </p>
            <StarRating value={Math.round(data.avgRating)} size="sm" />
            <p className="text-white/40 text-xs mt-2">dari 5 bintang</p>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 flex flex-col justify-center gap-2">
            {data.distribution.map((d) => (
              <RatingBar
                key={d.star}
                star={d.star}
                count={d.count}
                total={data.totalReviews}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Review Form (toggle) */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <span className="text-emerald-400">✏️</span> Tulis Ulasanmu
              </h3>
              <ReviewForm productId={productId} onSuccess={handleReviewSuccess} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review List */}
      {loadingReviews ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data || data.reviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 border border-white/10 rounded-2xl"
        >
          <p className="text-5xl mb-4">🍃</p>
          <p className="text-white/50 font-medium">Belum ada ulasan.</p>
          <p className="text-white/30 text-sm mt-1">Jadilah yang pertama mengulas produk ini!</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {data.reviews.map((review, i) => (
            <ReviewCard key={review.id} review={review} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
