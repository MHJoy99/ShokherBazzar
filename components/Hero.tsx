
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../types';

export const Hero: React.FC<{ products: Product[] }> = ({ products }) => {
  const [idx, setIdx] = useState(0);
  const heroProducts = products.slice(0, 5);

  useEffect(() => {
    const i = setInterval(() => {
        setIdx(current => (current + 1) % heroProducts.length);
    }, 6000);
    return () => clearInterval(i);
  }, [heroProducts.length]);

  if (!heroProducts.length) return null;
  const product = heroProducts[idx];

  return (
    <div className="relative h-[550px] md:h-[650px] w-full overflow-hidden bg-dark-950 border-b border-white/5 group">
       <AnimatePresence mode='wait'>
         <motion.div 
            key={product.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
         >
            {/* Background Image: Fixed to Top Center to avoid cutting off heads/logos */}
            <div 
                className="absolute inset-0 bg-cover bg-top md:bg-center transition-transform duration-[10000ms] ease-linear scale-100 group-hover:scale-105" 
                style={{ backgroundImage: `url(${product.images[0].src})` }}
            ></div>
            
            {/* Dark Overlays for Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/90 to-dark-950/30"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
         </motion.div>
       </AnimatePresence>

       <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex flex-col justify-center">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
              
              {/* Text Content */}
              <div className="md:col-span-7 space-y-6 pt-10 md:pt-0">
                  <motion.div 
                    key={`text-${product.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                      <div className="flex items-center gap-3 mb-4">
                          <span className="bg-primary text-black text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest shadow-glow">Featured</span>
                          {product.platform && (
                              <span className="border border-white/20 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest flex items-center gap-2 backdrop-blur-md">
                                  <i className="fas fa-gamepad"></i> {product.platform}
                              </span>
                          )}
                      </div>
                      <h1 className="text-4xl md:text-7xl font-black text-white leading-[0.9] uppercase italic mb-4 drop-shadow-2xl">
                          {product.name}
                      </h1>
                      <p className="text-gray-300 text-sm md:text-lg line-clamp-2 max-w-xl border-l-4 border-primary pl-4">
                          {product.short_description || "Experience the next level of gaming. Instant delivery available now."}
                      </p>
                  </motion.div>

                  <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.4 }}
                     className="flex flex-wrap items-center gap-4 pt-4"
                  >
                      <Link 
                        to={`/product/${product.id}`} 
                        className="bg-primary hover:bg-cyan-400 text-black text-base md:text-lg font-black py-3 md:py-4 px-8 md:px-10 rounded-xl shadow-glow hover:scale-105 transition-all flex items-center gap-3 uppercase italic"
                      >
                         <span>Buy Now</span>
                         <i className="fas fa-bolt"></i>
                      </Link>
                      <div className="text-white bg-black/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Starting at</p>
                          <p className="text-2xl md:text-3xl font-black text-white">৳{product.price}</p>
                      </div>
                  </motion.div>
              </div>

              {/* 3D Poster Card - Hidden on mobile to save space, or scaled down */}
              <div className="hidden md:block md:col-span-5 relative perspective-1000">
                  <motion.div 
                     key={`img-${product.id}`}
                     initial={{ opacity: 0, rotateY: 10, x: 50 }}
                     animate={{ opacity: 1, rotateY: -5, x: 0 }}
                     transition={{ duration: 0.5 }}
                     className="relative w-[300px] lg:w-[340px] aspect-[3/4] mx-auto bg-dark-900 rounded-2xl shadow-2xl border border-white/10 p-2 transform transition-transform"
                     style={{ transformStyle: 'preserve-3d' }}
                  >
                      {/* Forced Aspect Ratio Image */}
                      <img 
                        src={product.images[0].src} 
                        className="w-full h-full object-cover rounded-xl shadow-inner bg-dark-950" 
                        alt={product.name} 
                      />
                      
                      {/* Floating Status Badge */}
                      <div className="absolute -bottom-6 -right-6 bg-dark-800/90 backdrop-blur p-4 rounded-xl border border-white/10 shadow-xl flex items-center gap-3 animate-float z-20">
                          <div className="bg-green-500/20 text-green-500 w-10 h-10 rounded-full flex items-center justify-center">
                              <i className="fas fa-check"></i>
                          </div>
                          <div>
                              <p className="text-[10px] text-gray-400 uppercase font-bold">Status</p>
                              <p className="text-white font-bold text-sm">In Stock</p>
                          </div>
                      </div>
                  </motion.div>
              </div>
          </div>
       </div>

       {/* Navigation Dots */}
       <div className="absolute bottom-6 left-0 w-full z-20">
          <div className="max-w-7xl mx-auto px-4 flex justify-center md:justify-start gap-3">
              {heroProducts.map((p, i) => (
                  <button 
                    key={p.id}
                    onClick={() => setIdx(i)}
                    className={`relative h-1 rounded-full overflow-hidden transition-all duration-300 ${i === idx ? 'bg-primary w-16 md:w-24' : 'bg-white/20 w-8 md:w-16 hover:bg-white/40'}`}
                  >
                  </button>
              ))}
          </div>
       </div>
    </div>
  );
};
