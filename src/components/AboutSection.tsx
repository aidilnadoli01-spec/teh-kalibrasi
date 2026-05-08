'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';

interface TextRevealProps {
  text: string;
}

const TextReveal: React.FC<TextRevealProps> = ({ text }) => {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start 0.9", "start 0.25"]
  });

  const words = text.split(" ");

  return (
    <p ref={container} className="flex flex-wrap text-4xl font-medium leading-[1.1] md:text-6xl lg:text-8xl tracking-tighter font-outfit justify-center text-center max-w-5xl mx-auto">
      {words.map((word, i) => {
        const start = i / words.length;
        const end = (i + 1) / words.length;
        return (
          <Word key={i} progress={scrollYProgress} range={[start, end]}>
            {word}
          </Word>
        );
      })}
    </p>
  );
};

const Word: React.FC<{ children: string; progress: MotionValue<number>; range: [number, number] }> = ({ children, progress, range }) => {
  const opacity = useTransform(progress, range, [0.1, 1]);
  return (
    <span className="relative mx-[0.2em]">
      <motion.span style={{ opacity }} className="text-white">
        {children}
      </motion.span>
    </span>
  );
};

const AboutSection: React.FC = () => {
  return (
    <section className="relative z-10 -mt-[100vh] bg-black py-40 px-6 overflow-hidden border-t-[0.5px] border-white/5">
      <div className="container mx-auto">
        <motion.div
           initial={{ opacity: 0, y: 50 }}
           whileInView={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           viewport={{ once: true }}
           className="mb-20 text-center"
        >
          <span className="text-xs uppercase tracking-[0.8em] text-white/40 mb-10 block">WHO WE ARE</span>
        </motion.div>
        
        <TextReveal text="Calibration is not just a process. It is a philosophy of precision applied to the art of brewing. We source the finest leaves from the most remote gardens of Asia, ensuring every sip is a calibrated masterpiece." />
      </div>
    </section>
  );
};

export default AboutSection;
export { TextReveal };
