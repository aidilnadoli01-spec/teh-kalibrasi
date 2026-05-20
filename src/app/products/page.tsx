'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatCurrency } from '@/lib/currency';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  category_name?: string;
  category_slug?: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface CartItem {
  productId: number;
  quantity: number;
  price: number;
  name: string;
}

export default function ProductsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [addingToCartId, setAddingToCartId] = useState<number | null>(null);
  const [checkoutChecking, setCheckoutChecking] = useState(false);
  const [insufficientStockItems, setInsufficientStockItems] = useState<number[]>([]);
  const [checkoutWarning, setCheckoutWarning] = useState<string | null>(null);

  const requireLogin = (message: string) => {
    if (!session) {
      setLoginPromptMessage(message);
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addToCart = async (product: Product) => {
    if (!requireLogin("You need to login to add items to your cart.")) return;
    
    setAddingToCartId(product.id);
    
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 600));
    
    if (product.stock <= 0) {
      showToast("Gagal! Stok produk ini sudah habis.", "error");
      setAddingToCartId(null);
      return;
    }

    // Check stock against current cart
    const existingInCart = cart.find(item => item.productId === product.id);
    if (existingInCart && existingInCart.quantity >= product.stock) {
      showToast(`Stok terbatas! Hanya tersedia ${product.stock} pcs.`, "error");
      setAddingToCartId(null);
      return;
    }

    setCart((prevCart) => {
      const itemInCart = prevCart.find((item) => item.productId === product.id);
      if (itemInCart) {
        return prevCart.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prevCart,
        {
          productId: product.id,
          quantity: 1,
          price: product.price,
          name: product.name,
        },
      ];
    });
    
    showToast(`${product.name} ditambahkan ke keranjang!`, "success");
    setAddingToCartId(null);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    if (session) {
      fetchWishlist();
    }
  }, [session]);

  const fetchWishlist = async () => {
    try {
      const response = await fetch('/api/wishlist');
      const data = await response.json();
      if (Array.isArray(data)) {
        setWishlist(data.map((item) => item.id));
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
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

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error('Invalid products data format');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };



  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
    setInsufficientStockItems((prev) => {
      const updated = prev.filter((id) => id !== productId);
      if (updated.length === 0) {
        setCheckoutWarning(null);
      }
      return updated;
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    const maxStock = product ? product.stock : 99;
    
    let finalQty = quantity;
    if (product && quantity > product.stock) {
      finalQty = product.stock;
      showToast(`Stok terbatas! Hanya tersedia ${product.stock} pcs untuk ${product.name}.`, "error");
    }

    if (finalQty <= 0) {
      removeFromCart(productId);
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.productId === productId ? { ...item, quantity: finalQty } : item
        )
      );

      // Clear from insufficient stock list if it's now within limits
      if (product && finalQty <= product.stock) {
        setInsufficientStockItems((prev) => {
          const updated = prev.filter((id) => id !== productId);
          if (updated.length === 0) {
            setCheckoutWarning(null);
          }
          return updated;
        });
      }
    }
  };

  const handleCheckoutClick = async () => {
    if (!requireLogin("You need to login to proceed with checkout.")) return;
    
    setCheckoutChecking(true);
    setCheckoutWarning(null);
    setInsufficientStockItems([]);

    try {
      const response = await fetch('/api/products');
      const latestProducts: Product[] = await response.json();
      
      if (!Array.isArray(latestProducts)) {
        throw new Error("Invalid products response");
      }

      // Update local products state with latest stocks
      setProducts(latestProducts);

      const insufficientIds: number[] = [];
      
      for (const item of cart) {
        const latestProd = latestProducts.find(p => p.id === item.productId);
        if (!latestProd || latestProd.stock < item.quantity) {
          insufficientIds.push(item.productId);
        }
      }

      if (insufficientIds.length > 0) {
        setInsufficientStockItems(insufficientIds);
        setCheckoutWarning("Beberapa produk memiliki stock yang tidak mencukupi. Silakan kurangi kuantitas atau hapus produk bertanda merah.");
        showToast("Stok berubah! Beberapa produk di keranjang Anda melebihi stok yang tersedia.", "error");
      } else {
        setShowCheckout(true);
      }
    } catch (err) {
      console.error("Error during pre-checkout recheck:", err);
      showToast("Gagal melakukan pengecekan stok terbaru. Silakan coba lagi.", "error");
    } finally {
      setCheckoutChecking(false);
    }
  };

  const toggleWishlist = async (productId: number) => {
    if (!requireLogin("You need to login to save to your wishlist.")) return;

    const isRemoving = wishlist.includes(productId);
    const product = products.find(p => p.id === productId);
    const productName = product ? product.name : "Produk";
    
    // 1. Optimistic Update (UI updates immediately)
    setWishlist(prev => 
      isRemoving 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );

    // 2. Show Notification immediately
    if (isRemoving) {
      showToast(`${productName} dihapus dari wishlist`, "error");
    } else {
      showToast(`❤️ ${productName} ditambahkan ke wishlist!`, "success");
    }

    try {
      // 3. Background Sync with API
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      
      if (!res.ok) {
        // Rollback on failure
        setWishlist(prev => 
          isRemoving 
            ? [...prev, productId]
            : prev.filter(id => id !== productId)
        );
        showToast("Koneksi gagal, wishlist tidak tersimpan.", "error");
      }
    } catch (err) {
      console.error('Failed to update wishlist', err);
      // Rollback on error
      setWishlist(prev => 
        isRemoving 
          ? [...prev, productId]
          : prev.filter(id => id !== productId)
      );
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === 'all' || product.category_slug === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-6xl md:text-7xl font-bold mb-4">
              Order Your <span className="text-emerald-500">Collection</span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Browse our premium collection and place your order today
            </p>
          </motion.div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex overflow-x-auto pb-2 w-full md:w-auto space-x-2 scrollbar-none">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 whitespace-nowrap rounded-full text-sm font-bold transition-all ${
                  activeCategory === 'all'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                All Products
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.slug)}
                  className={`px-4 py-2 whitespace-nowrap rounded-full text-sm font-bold transition-all ${
                    activeCategory === category.slug
                      ? 'bg-emerald-500 text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="w-full md:w-64 relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 text-white rounded-lg border border-white/10 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Products Grid */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="text-center text-white/60 py-20">
                  <p className="text-lg mb-2">Loading products...</p>
                  <p className="text-sm">Make sure MySQL database is setup</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center text-white/60 py-20">
                  <p className="text-lg mb-2">No products found</p>
                  <p className="text-sm">Please setup the database or try different filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-all duration-300 relative group flex flex-col h-full"
                    >
                      {/* Wishlist Heart Button */}
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                        title={wishlist.includes(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                      >
                       <span className={`text-xl transition-all hover:scale-125 ${wishlist.includes(product.id) ? 'text-red-500' : 'text-white'}`}>
                         {wishlist.includes(product.id) ? '♥' : '♡'}
                       </span>
                      </button>

                      {product.image_url ? (
                        <div className="w-full h-48 md:h-56 bg-black/40 flex items-center justify-center shrink-0 border-b border-white/5 p-2">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-contain shrink-0"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 md:h-56 bg-white/5 flex items-center justify-center shrink-0 border-b border-white/5">
                          <span className="text-5xl text-white/20">🍵</span>
                        </div>
                      )}
                      
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h3 className="text-xl font-bold line-clamp-1">{product.name}</h3>
                          {product.category_name && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full whitespace-nowrap">
                              {product.category_name}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-white/60 text-sm mb-4 line-clamp-2 min-h-[40px]">
                          {product.description}
                        </p>
                        
                        {/* Spacer to push pricing and buttons to bottom */}
                        <div className="mt-auto">
                          <div className="flex items-center justify-between mb-4 pt-4 border-t border-white/5">
                            <span className="text-xl md:text-2xl font-bold text-emerald-500">
                              {formatCurrency(product.price)}
                            </span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${product.stock > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock'}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => addToCart(product)}
                            disabled={product.stock === 0 || addingToCartId === product.id}
                            className={`w-full py-3 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                              product.stock === 0 
                                ? 'bg-red-500/20 text-red-500 border border-red-500/30' 
                                : 'bg-emerald-500 hover:bg-emerald-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            }`}
                          >
                            {addingToCartId === product.id ? (
                              <>
                                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                Memasukkan...
                              </>
                            ) : product.stock === 0 ? (
                              'Out of Stock'
                            ) : (
                              'Add to Cart'
                            )}
                          </button>
                          
                          <a
                            href={`/products/${product.id}`}
                            className="mt-3 w-full py-2 flex items-center justify-center text-sm text-white/50 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all gap-2"
                          >
                            <span>⭐</span> View Details &amp; Reviews
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="sticky top-32 bg-white/5 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Cart</h2>
                  <span className="bg-emerald-500 text-black text-sm font-bold px-3 py-1 rounded-full">
                    {cart.length}
                  </span>
                </div>

                {cart.length === 0 ? (
                  <p className="text-white/50 text-center py-8">Your cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map((item) => {
                        const isInsufficient = insufficientStockItems.includes(item.productId);
                        const product = products.find(p => p.id === item.productId);
                        const maxStock = product ? product.stock : 0;
                        return (
                          <div 
                            key={item.productId} 
                            className={`bg-white/5 rounded p-4 border transition-all duration-300 ${
                              isInsufficient 
                                ? 'border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                                : 'border-white/5'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-sm text-white">{item.name}</h4>
                              <button
                                onClick={() => removeFromCart(item.productId)}
                                className="text-red-500 text-sm hover:text-red-400"
                              >
                                ✕
                              </button>
                            </div>
                            {isInsufficient && (
                              <p className="text-red-400 text-[10px] font-bold mb-2 uppercase tracking-wide">
                                ⚠️ Stok tidak mencukupi (Tersedia: {maxStock})
                              </p>
                            )}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-emerald-500">{formatCurrency(item.price)}</span>
                              <input
                                type="number"
                                min="1"
                                max={maxStock}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateQuantity(item.productId, parseInt(e.target.value) || 1)
                                }
                                className={`w-14 px-2 py-1 bg-white/10 text-white rounded text-center text-sm border focus:outline-none ${
                                  isInsufficient ? 'border-red-500 text-red-200' : 'border-white/10 focus:border-emerald-500'
                                }`}
                              />
                            </div>
                            <p className="text-white/50 text-xs">
                              Subtotal: {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-white/10 pt-4 mb-4">
                      {checkoutWarning && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg mb-4">
                          <p className="font-bold mb-1">⚠️ Stok Kurang</p>
                          <p className="opacity-90">{checkoutWarning}</p>
                        </div>
                      )}
                      <div className="flex justify-between mb-4">
                        <span className="font-bold">Total:</span>
                        <span className="text-emerald-500 font-bold text-xl">
                          {formatCurrency(totalPrice)}
                        </span>
                      </div>
                      <button
                        onClick={handleCheckoutClick}
                        disabled={checkoutChecking}
                        className="w-full py-3 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                      >
                        {checkoutChecking ? (
                          <>
                            <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            Memeriksa Stok...
                          </>
                        ) : (
                          'Checkout'
                        )}
                      </button>
                    </div>
                  </>
                )}

                {/* Track Order Button - Always Visible */}
                <button
                  onClick={() => window.location.href = '/track-order'}
                  className="w-full py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-all"
                >
                  Track Order
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Login Prompt Modal */}
      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowLoginPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-stone-900 border border-emerald-500/30 rounded-2xl p-8 max-w-sm w-full shadow-[0_0_40px_rgba(16,185,129,0.15)] relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 font-outfit">Login Required</h3>
                <p className="text-white/70 mb-6 text-sm">{loginPromptMessage}</p>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="w-full py-3 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-600 transition-all active:scale-95"
                  >
                    Go to Login
                  </button>
                  <button
                    onClick={() => setShowLoginPrompt(false)}
                    className="w-full py-3 bg-white/5 text-white font-bold rounded-lg hover:bg-white/10 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          totalPrice={totalPrice}
          onClose={() => setShowCheckout(false)}
          onSuccess={(orderId) => {
            setCreatedOrderId(orderId);
            setShowSuccessModal(true);
            setCart([]);
            setShowCheckout(false);
          }}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowSuccessModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-emerald-500/30 rounded-lg p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-white mb-2">Order Created!</h2>
              <p className="text-white/60 mb-4">Your order has been created successfully</p>
              
              {createdOrderId && (
                <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-4 mb-6">
                  <p className="text-white/60 text-sm mb-1">Order ID</p>
                  <p className="text-emerald-500 font-bold text-2xl">#{createdOrderId}</p>
                </div>
              )}

              <p className="text-white mb-6">
                Please go to <span className="text-emerald-500 font-bold">Track Order</span> to view payment details and complete your payment.
              </p>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  window.location.href = '/track-order';
                }}
                className="w-full py-3 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-600 transition-all mb-3"
              >
                Go to Track Order
              </button>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-10 left-1/2 z-[9999] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[320px] border transform -translate-x-1/2 ${
              toast.type === 'success' 
                ? 'bg-[#22C55E] border-white/20 text-white' 
                : 'bg-red-600 border-white/20 text-white'
            }`}
          >
            <span className="text-xl">
              {toast.type === 'success' ? '✅' : '⚠️'}
            </span>
            <span className="font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckoutModal({
  cart,
  totalPrice,
  onClose,
  onSuccess,
}: {
  cart: CartItem[];
  totalPrice: number;
  onClose: () => void;
  onSuccess: (orderId: number) => void;
}) {
  const { data: session } = useSession();
  
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const [loadingPayments, setLoadingPayments] = useState(false);

  React.useEffect(() => {
    const getPaymentMethods = async () => {
      setLoadingPayments(true);
      try {
        const response = await fetch('/api/payment-methods?active=true');
        const data = await response.json();
        if (Array.isArray(data)) {
          setPaymentMethods(data);
          if (data.length > 0) {
            setSelectedMethodId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching active payment methods:', err);
      } finally {
        setLoadingPayments(false);
      }
    };
    getPaymentMethods();
  }, []);

  const [formData, setFormData] = useState({
    customerName: session?.user?.name || '',
    customerEmail: session?.user?.email || '',
    customerPhone: '',
    customerAddress: '',
    paymentMethod: 'bank_transfer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const finalPrice = Math.max(0, totalPrice - discount);

  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Validasi khusus per field
    if (name === 'customerName') {
      // Hanya huruf, spasi, dan titik
      const filtered = value.replace(/[^a-zA-Z\s.'-]/g, '');
      setFormData((prev) => ({ ...prev, [name]: filtered }));
      return;
    }
    if (name === 'customerPhone') {
      // Hanya angka dan + di depan
      const filtered = value.replace(/[^0-9+]/g, '');
      setFormData((prev) => ({ ...prev, [name]: filtered }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const selectedPM = paymentMethods.find(pm => pm.id === selectedMethodId);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          paymentMethodId: selectedMethodId,
          paymentMethodName: selectedPM ? selectedPM.method_name : null,
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          totalPrice: finalPrice,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();
      onSuccess(data.orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setPromoError('');
    try {
      const res = await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // calculate discount
      let calcDiscount = (totalPrice * data.discount_percentage) / 100;
      if (data.max_discount && calcDiscount > data.max_discount) {
        calcDiscount = data.max_discount;
      }

      setDiscount(calcDiscount);
      setPromoApplied(true);
    } catch (err: any) {
      setPromoError(err.message);
      setDiscount(0);
      setPromoApplied(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-emerald-500/30 rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Checkout</h2>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="cursor-pointer text-white/60 hover:text-white hover:bg-red-500/20 text-2xl w-10 h-10 flex items-center justify-center rounded transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Close checkout"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-bold mb-2">Nama Lengkap</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
              maxLength={50}
              placeholder="Masukkan nama lengkap"
              className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-emerald-500 focus:bg-gray-800/80 outline-none"
            />
            <p className="text-white/30 text-xs mt-0.5">{formData.customerName.length}/50 — hanya huruf & spasi</p>
          </div>

          <div>
            <label className="block text-white text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-emerald-500 focus:bg-gray-800/80 outline-none"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-bold mb-2">Nomor Telepon</label>
            <input
              type="text"
              inputMode="numeric"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleChange}
              maxLength={15}
              placeholder="Contoh: 08123456789"
              className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-emerald-500 focus:bg-gray-800/80 outline-none tracking-widest"
            />
            <p className="text-white/30 text-xs mt-0.5">{formData.customerPhone.length}/15 — hanya angka</p>
          </div>



          <div>
            <label className="block text-white text-sm font-bold mb-2">Metode Pembayaran</label>
            {loadingPayments ? (
              <p className="text-white/50 text-xs animate-pulse">Memuat metode pembayaran...</p>
            ) : paymentMethods.length === 0 ? (
              <p className="text-red-400 text-xs">Tidak ada metode pembayaran aktif. Hubungi Admin.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-1">
                {paymentMethods.map((pm) => {
                  const isSelected = selectedMethodId === pm.id;
                  return (
                    <div
                      key={pm.id}
                      onClick={() => setSelectedMethodId(pm.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {pm.logo ? (
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
                            <img
                              src={pm.logo}
                              alt={pm.method_name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-lg shrink-0">
                            💳
                          </div>
                        )}
                        <div>
                          <p className="text-white font-bold text-sm leading-tight">{pm.method_name}</p>
                          {pm.description && (
                            <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{pm.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center justify-center">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected ? 'border-emerald-500' : 'border-gray-500'
                          }`}
                        >
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded p-4 mb-4">
            <h3 className="text-white/80 font-bold mb-2">Promo Code</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter WELCOME20"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  if (promoApplied) {
                    setPromoApplied(false);
                    setDiscount(0);
                  }
                }}
                disabled={promoApplied}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded outline-none uppercase"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={promoApplied || !promoCode}
                className="px-4 py-2 bg-emerald-500/20 text-emerald-500 font-bold rounded hover:bg-emerald-500/30 transition-all disabled:opacity-50"
              >
                {promoApplied ? 'Applied' : 'Apply'}
              </button>
            </div>
            {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
            {promoApplied && <p className="text-emerald-500 text-xs mt-1">Promo applied successfully!</p>}
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded p-4 mb-4">
            <p className="text-white/60 text-sm mb-2">Order Summary:</p>
            {cart.map((item) => (
              <div key={item.productId} className="flex justify-between text-white/80 text-sm">
                <span>
                  {item.name} x{item.quantity}
                </span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between text-white/70">
              <span>Subtotal:</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-500 text-sm">
                <span>Discount:</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between text-white font-bold">
              <span>Total:</span>
              <span className="text-emerald-500">{formatCurrency(finalPrice)}</span>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-600 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </form>
      </motion.div>

    </div>
  );
}
