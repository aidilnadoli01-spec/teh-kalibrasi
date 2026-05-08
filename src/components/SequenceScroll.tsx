'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useScroll, useTransform, motion, useSpring } from 'framer-motion';
import Magnetic from './Magnetic';

const TOTAL_FRAMES = 240;

const SequenceScroll: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Smooth out the scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const frameIndex = useTransform(smoothProgress, [0, 1], [1, TOTAL_FRAMES]);

  useEffect(() => {
    const preloadImages = async () => {
      const loadedImages: HTMLImageElement[] = [];
      let loadedCount = 0;

      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const img = new Image();
        const frame = i.toString().padStart(3, '0');
        img.src = `/sequence/ezgif-frame-${frame}.jpg`;
        img.onload = () => {
          loadedCount++;
          if (loadedCount === TOTAL_FRAMES) {
            setIsLoaded(true);
          }
        };
        loadedImages.push(img);
      }
      setImages(loadedImages);
    };

    preloadImages();
  }, []);

  useEffect(() => {
    if (!isLoaded || !canvasRef.current || images.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const render = (index: number) => {
      const img = images[Math.floor(index) - 1];
      if (!img) return;

      const canvas = canvasRef.current!;
      const iw = img.width;
      const ih = img.height;
      const cw = canvas.width;
      const ch = canvas.height;

      // Cover fit logic
      const scale = Math.max(cw / iw, ch / ih);
      const nw = iw * scale;
      const nh = ih * scale;
      const nx = (cw - nw) / 2;
      const ny = (ch - nh) / 2;

      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, nx, ny, nw, nh);
    };

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        render(frameIndex.get());
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const unsubscribe = frameIndex.on('change', (latest) => {
      render(latest);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribe();
    };
  }, [isLoaded, images, frameIndex]);

  return (
    <div ref={containerRef} className="relative h-[600vh] bg-black">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Text Overlays */}
        <div className="relative z-10 h-full w-full">
          {/* 0% Scroll: Title */}
          <motion.div
            style={{
              opacity: useTransform(scrollYProgress, [0, 0.1, 0.2], [0, 1, 0]),
              y: useTransform(scrollYProgress, [0, 0.1, 0.2], [50, 0, -50])
            }}
            className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center"
          >
            <h1 className="text-6xl font-bold tracking-tighter text-white md:text-8xl lg:text-9xl uppercase font-outfit">
              Tehkalibrasi
            </h1>
            <p className="mt-4 text-xl font-light text-white/60 md:text-2xl tracking-widest uppercase">
              The Art of Precise Brewing
            </p>
          </motion.div>

          {/* 30% Scroll: Slogan Left */}
          <motion.div
            style={{
              opacity: useTransform(scrollYProgress, [0.25, 0.35, 0.45], [0, 1, 0]),
              x: useTransform(scrollYProgress, [0.25, 0.35, 0.45], [-100, 0, 100])
            }}
            className="absolute inset-y-0 left-0 flex w-full max-w-2xl items-center p-10 md:pl-20"
          >
            <h2 className="text-4xl font-medium leading-tight text-white md:text-6xl font-outfit">
              Crafted with <span className="italic text-emerald-500">patience</span>, delivered with soul.
            </h2>
          </motion.div>

          {/* 60% Scroll: Slogan Right */}
          <motion.div
            style={{
              opacity: useTransform(scrollYProgress, [0.55, 0.65, 0.75], [0, 1, 0]),
              x: useTransform(scrollYProgress, [0.55, 0.65, 0.75], [100, 0, -100])
            }}
            className="absolute inset-y-0 right-0 flex w-full max-w-2xl items-center justify-end p-10 text-right md:pr-20"
          >
            <h2 className="text-4xl font-medium leading-tight text-white md:text-6xl font-outfit">
              Every leaf is a story of <span className="text-emerald-500">balance</span>.
            </h2>
          </motion.div>

          {/* 90% Scroll: CTA */}
          <motion.div
            style={{
              opacity: useTransform(scrollYProgress, [0.85, 0.95, 1], [0, 1, 0]),
              scale: useTransform(scrollYProgress, [0.85, 0.95, 1], [0.8, 1, 1.2])
            }}
            className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center"
          >
            <h2 className="mb-8 text-4xl font-bold text-white md:text-6xl font-outfit">
              Experience the Calibration.
            </h2>
            <Magnetic>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-emerald-500 hover:text-white"
              >
                <span className="text-sm font-bold uppercase tracking-tighter">Enter</span>
              </motion.button>
            </Magnetic>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SequenceScroll;
