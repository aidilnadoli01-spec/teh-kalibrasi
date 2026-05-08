'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Magnetic from './Magnetic';

const CtaSection: React.FC = () => {
  return (
    <section className="relative h-screen bg-black flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-40">
        <motion.div
           animate={{
             scale: [1, 1.2, 1],
             opacity: [0.3, 0.5, 0.3],
             rotate: [0, 90, 180, 270, 360],
           }}
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,transparent_70%)]"
        />
      </div>

      <div className="container relative z-10 mx-auto px-6 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-9xl font-bold tracking-tighter text-white mb-12 font-outfit uppercase"
        >
          Join the <br /> <span className="text-emerald-500">Calibration.</span>
        </motion.h2>
        
        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           transition={{ delay: 0.5 }}
           className="flex justify-center"
        >
          <Magnetic>
            <button className="px-12 py-5 bg-white text-black font-bold uppercase tracking-widest rounded-full hover:bg-emerald-500 hover:text-white transition-all duration-300 transform hover:scale-105 active:scale-95 font-outfit">
              <a href="/products">Order Your Collection</a>
            </button>
          </Magnetic>
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-10 md:left-20">
        <div className="text-[10px] uppercase tracking-[1em] text-white/20">EST. 2024</div>
      </div>
    </section>
  );
};

export default CtaSection;
