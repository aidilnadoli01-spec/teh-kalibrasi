'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const testimonials = [
  {
    quote: "The calibration of flavor is unlike anything I've experienced. Truly a masterclass in tea.",
    author: "Elena Rossi",
    role: "Sommelier, Milan"
  },
  {
    quote: "Tehkalibrasi has redefined my morning ritual. The consistency is breathtaking.",
    author: "James Chen",
    role: "Culinary Critic"
  },
  {
    quote: "Every leaf tells a story. You can taste the altitude and the precision in every drop.",
    author: "Sarah Jenkins",
    role: "Tea Sommelier"
  }
];

const TestimonialSection: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-stone-950 py-40 px-6 relative overflow-hidden">
      <div className="container mx-auto max-w-6xl relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="flex flex-col items-center text-center"
          >
            <span className="text-emerald-500 text-6xl font-serif mb-10">"</span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight text-white mb-12 font-outfit max-w-4xl leading-tight italic">
              {testimonials[index].quote}
            </h2>
            <div className="flex flex-col gap-1">
              <span className="text-xl font-bold text-white uppercase tracking-tighter">{testimonials[index].author}</span>
              <span className="text-xs uppercase tracking-[0.4em] text-white/40">{testimonials[index].role}</span>
            </div>
          </motion.div>
        </AnimatePresence>
        
        <div className="flex justify-center gap-2 mt-20">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-12 h-1 rounded-full transition-all duration-500 ${index === i ? 'bg-emerald-500 w-24' : 'bg-white/10'}`}
            />
          ))}
        </div>
      </div>
      
      {/* Decorative BG element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[120px]" />
    </section>
  );
};

export default TestimonialSection;
