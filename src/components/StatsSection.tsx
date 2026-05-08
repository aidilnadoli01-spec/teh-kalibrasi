'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView, useSpring, useTransform, useMotionValueEvent } from 'framer-motion';

const CountUp: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (current) => Math.floor(current).toLocaleString());
  
  const [currentDisplay, setCurrentDisplay] = useState("0");

  useMotionValueEvent(display, "change", (latest) => {
    setCurrentDisplay(latest);
  });

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, spring, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {currentDisplay}
      <span>{suffix}</span>
    </span>
  );
};

const StatsSection: React.FC = () => {
  const stats = [
    { label: "Gardens Sourced", value: 42, suffix: "+" },
    { label: "Tea Varieties", value: 156, suffix: "" },
    { label: "Brews per Day", value: 12400, suffix: "" },
    { label: "Precision Score", value: 99.9, suffix: "%" },
  ];

  return (
    <section className="bg-black py-40 border-y border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="text-5xl md:text-7xl font-bold tracking-tighter text-white font-outfit">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </div>
              <span className="text-xs uppercase tracking-[0.5em] text-white/40">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
