'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatCurrency } from '@/lib/currency';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      // ✅ Cegah admin mengakses halaman user
      if ((session?.user as any)?.role === 'admin') {
        router.push('/admin');
        return;
      }
      fetchOrders();
    }
  }, [status, router, session]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/user');
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="pt-32 pb-20 container mx-auto px-6">
        <div className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Profile</h1>
            <p className="text-white/60">Welcome back, {session?.user?.name}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="px-6 py-2 bg-red-500/20 text-red-500 font-bold rounded-lg hover:bg-red-500/30 transition-all border border-red-500/50"
          >
            Sign Out
          </button>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6 text-emerald-500">My Orders</h2>
          {orders.length === 0 ? (
            <div className="bg-white/5 p-8 rounded-lg text-center text-white/50 border border-white/10">
              <p>You haven't placed any orders yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order: any) => (
                <div key={order.id} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div>
                      <p className="text-sm text-white/50 mb-1">Order #{order.id}</p>
                      <p className="font-bold text-lg">{formatCurrency(parseFloat(order.total_price))}</p>
                      <p className="text-xs text-white/40 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : ''}
                        ${order.status === 'processing' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' : ''}
                        ${order.status === 'shipped' ? 'bg-purple-500/20 text-purple-500 border border-purple-500/30' : ''}
                        ${order.status === 'delivered' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : ''}
                        ${order.status === 'cancelled' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : ''}
                      `}>
                        Order: {order.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${order.payment_status === 'unpaid' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : ''}
                        ${order.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : ''}
                        ${order.payment_status === 'verified' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : ''}
                      `}>
                        Payment: {order.payment_status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-white/70">
                     <p><span className="font-bold text-white/50">Method:</span> {order.payment_method}</p>
                     <p><span className="font-bold text-white/50">Address:</span> {order.customer_address}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
