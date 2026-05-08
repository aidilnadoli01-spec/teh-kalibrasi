'use client';

import React from 'react';
import { motion } from 'framer-motion';

const bentoItems = [
  {
    title: "Origins",
    description: "Hand-picked from the high altitudes of Wuyi mountains.",
    className: "md:col-span-2 md:row-span-2 bg-stone-900 border border-white/5",
    image: "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "The Steam",
    description: "Precise temperature control for optimal flavor.",
    className: "md:col-span-1 md:row-span-1 bg-emerald-900/20 border border-white/5",
    image: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Purity",
    description: "Zero additives, zero compromise.",
    className: "md:col-span-1 md:row-span-2 bg-stone-900 border border-white/5",
    image: "https://images.unsplash.com/photo-1544787210-2211d440ef45?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "The Leaves",
    description: "Whole leaves, never dust.",
    className: "md:col-span-1 md:row-span-1 bg-stone-950 border border-white/5",
    image: "https://images.unsplash.com/photo-1563911191470-a2491b658252?q=80&w=1000&auto=format&fit=crop"
  }
];

const BentoSection: React.FC = () => {
  return (
    <section className="bg-black py-20 px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-4 h-full md:h-[800px]">
          {bentoItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`group relative overflow-hidden rounded-3xl p-8 flex flex-col justify-end ${item.className}`}
            >
              <img 
                src={item.image} 
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700 grayscale hover:grayscale-0"
                alt={item.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold uppercase tracking-tighter text-white font-outfit">{item.title}</h3>
                <p className="text-white/60 text-sm mt-2 max-w-[200px]">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BentoSection;
