'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();

  const menuItems = [
    { title: 'Home', href: '/' },
    { title: 'The Collection', href: '/products' },
    { title: 'Track Order', href: '/track-order' },
  ];

  const menuVariants: Variants = {
    open: {
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.76, 0, 0.24, 1],
      },
    },
    closed: {
      y: '-100%',
      transition: {
        duration: 0.8,
        ease: [0.76, 0, 0.24, 1],
      },
    },
  };

  const itemVariants: Variants = {
    open: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: 0.5 + (i * 0.1),
        duration: 0.5,
        ease: [0.76, 0, 0.24, 1],
      },
    }),
    closed: {
      y: 50,
      opacity: 0,
    },
  };

  return (
    <>
      <nav className="fixed top-0 left-0 z-[60] w-full p-6 md:p-10 flex items-center justify-between mix-blend-difference">
        <div className="text-2xl font-bold uppercase tracking-tighter text-white font-outfit">
          Tehkalibrasi
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative z-[70] flex items-center gap-2 group cursor-pointer"
        >
          <span className="text-sm font-medium uppercase tracking-widest text-white hidden md:block">
            {isOpen ? 'Close' : 'Menu'}
          </span>
          <div className="relative w-8 h-4 flex flex-col justify-between">
             <motion.div animate={isOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} className="w-8 h-[2px] bg-white" />
             <motion.div animate={isOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} className="w-8 h-[2px] bg-white" />
          </div>
        </button>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 z-[50] flex flex-col bg-stone-900 text-white p-10 md:p-20"
          >
            <div className="mt-20 flex flex-col md:flex-row justify-between h-full">
              <div className="flex flex-col gap-4">
                {menuItems.map((item, i) => (
                  <div key={item.title} className="overflow-hidden">
                    <motion.a
                      href={item.href}
                      custom={i}
                      variants={itemVariants}
                      className="text-5xl md:text-8xl font-bold uppercase tracking-tighter hover:italic hover:pl-4 transition-all duration-300 font-outfit block"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.title}
                    </motion.a>
                  </div>
                ))}
                
                {/* Auth Links */}
                <div className="mt-8 pt-8 border-t border-white/20">
                  {status === 'authenticated' ? (
                    <div className="flex flex-col gap-4">
                      <div className="overflow-hidden">
                        <motion.a
                          href="/profile"
                          custom={menuItems.length}
                          variants={itemVariants}
                          className="text-4xl md:text-5xl font-bold uppercase tracking-tighter hover:italic hover:pl-4 transition-all duration-300 font-outfit block text-emerald-500"
                          onClick={() => setIsOpen(false)}
                        >
                          My Profile
                        </motion.a>
                      </div>
                      <div className="overflow-hidden">
                        <motion.a
                          href="/wishlist"
                          custom={menuItems.length + 1}
                          variants={itemVariants}
                          className="text-4xl md:text-5xl font-bold uppercase tracking-tighter hover:italic hover:pl-4 transition-all duration-300 font-outfit block text-pink-500"
                          onClick={() => setIsOpen(false)}
                        >
                          My Wishlist
                        </motion.a>
                      </div>
                      <div className="overflow-hidden mt-4">
                        <motion.button
                          custom={menuItems.length + 2}
                          variants={itemVariants}
                          className="text-3xl md:text-4xl font-bold uppercase tracking-tighter hover:italic hover:pl-4 transition-all duration-300 font-outfit block text-red-500/80 hover:text-red-500 text-left"
                          onClick={() => {
                            setIsOpen(false);
                            signOut({ callbackUrl: '/' });
                          }}
                        >
                          Sign Out
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                       <div className="overflow-hidden">
                        <motion.a
                          href="/login"
                          custom={menuItems.length}
                          variants={itemVariants}
                          className="text-4xl md:text-5xl font-bold uppercase tracking-tighter hover:italic hover:pl-4 transition-all duration-300 font-outfit block text-emerald-500"
                          onClick={() => setIsOpen(false)}
                        >
                          Login
                        </motion.a>
                      </div>
                      <div className="overflow-hidden">
                        <motion.a
                          href="/register"
                          custom={menuItems.length + 1}
                          variants={itemVariants}
                          className="text-3xl md:text-4xl font-bold uppercase tracking-tighter hover:italic hover:pl-4 transition-all duration-300 font-outfit block text-white/50"
                          onClick={() => setIsOpen(false)}
                        >
                          Register
                        </motion.a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10 md:mt-0 flex flex-col justify-end gap-10">
                <div>
                  <h3 className="text-xs uppercase tracking-[0.5em] text-white/40 mb-4">Registry</h3>
                  <div className="flex flex-col gap-2 text-lg">
                    <a href="#" className="hover:text-emerald-500 transition-colors underline-offset-4 hover:underline">Instagram</a>
                    <a href="#" className="hover:text-emerald-500 transition-colors underline-offset-4 hover:underline">TikTok</a>
                    <a href="#" className="hover:text-emerald-500 transition-colors underline-offset-4 hover:underline">Brewers Club</a>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-white/60 max-w-[200px]">
                    Jakarta, Indonesia. <br />
                    Calibrating your tea experience.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
