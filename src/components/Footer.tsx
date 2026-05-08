'use client';

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-20 px-6 border-t border-white/5">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-32">
          <div className="md:col-span-2">
            <h2 className="text-4xl font-bold uppercase tracking-tighter mb-8 font-outfit">Tehkalibrasi</h2>
            <p className="text-white/40 max-w-sm text-lg">
              Crafting experiences through the precision of nature and science. The ultimate destination for tea enthusiasts.
            </p>
          </div>
          
          <div>
            <h3 className="text-xs uppercase tracking-[0.5em] text-emerald-500 mb-6 font-bold">Explore</h3>
            <ul className="flex flex-col gap-4 text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">The Lab</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Collections</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Subscriptions</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Journal</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.5em] text-emerald-500 mb-6 font-bold">Contact</h3>
            <ul className="flex flex-col gap-4 text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-white transition-colors">TikTok</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Email Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Locate Store</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end gap-10">
          <div className="text-[120px] md:text-[200px] lg:text-[250px] font-bold uppercase tracking-tighter leading-none text-white/5 select-none font-outfit">
            CALIBRATE
          </div>
          
          <div className="flex flex-col items-end gap-2 text-[10px] uppercase tracking-widest text-white/40 pb-4">
            <span>© 2026 TEHKALIBRASI. ALL RIGHTS RESERVED.</span>
            <span>DESIGNED BY CREATIVE STUDIO</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
