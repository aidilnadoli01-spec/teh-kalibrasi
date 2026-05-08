'use client';

import React from 'react';
import SmoothScroll from '@/components/SmoothScroll';
import Preloader from '@/components/Preloader';
import Navbar from '@/components/Navbar';
import SequenceScroll from '@/components/SequenceScroll';
import AboutSection from '@/components/AboutSection';
import BentoSection from '@/components/BentoSection';
import StatsSection from '@/components/StatsSection';
import TestimonialSection from '@/components/TestimonialSection';
import CtaSection from '@/components/CtaSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <SmoothScroll>
      <main className="relative min-h-screen bg-black">
        <Preloader />
        <Navbar />
        
        {/* Scrollytelling Hero Area */}
        <SequenceScroll />
        
        {/* Content Sections */}
        <AboutSection />
        <BentoSection />
        <StatsSection />
        <TestimonialSection />
        <CtaSection />
        <Footer />
        
      </main>
    </SmoothScroll>
  );
}
