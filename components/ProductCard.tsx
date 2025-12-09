
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { Product } from '../types';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const isVar = product.variations && product.variations.length > 0;
  const price = isVar ? `From ৳${Math.min(...product.variations!.map(v => parseFloat(v.price)))}` : `৳${product.price}`;

  return (
    <motion.div whileHover={{ y: -8 }} className="bg-dark-900 rounded-xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all group h-full flex flex-col shadow-lg hover:shadow-glow-sm">
       <Link to={`/product/${product.id}`} className="relative block aspect-[3/4] bg-dark-950 overflow-hidden">
          <img 
            src={product.images[0].src} 
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            alt={product.name} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-60"></div>
          
          {product.platform && (
               <div className="absolute top-3 left-3 bg-black/70 backdrop-blur text-white text-[10px] px-2 py-1 rounded border border-white/10 uppercase font-bold tracking-wider flex items-center gap-1">
                   <i className="fas fa-gamepad text-primary"></i> {product.platform}
               </div>
          )}
          {product.on_sale && (
              <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg">
                  SALE
              </div>
          )}
       </Link>
       
       <div className="p-5 flex flex-col flex-grow relative">
          {/* Performance Optimization: Removed absolute blur overlay that caused lag. Using simple opacity instead. */}
          <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-white font-bold text-sm mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
              <div className="mt-auto flex justify-between items-end border-t border-white/5 pt-3">
                <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Price</p>
                    <span className="text-lg font-black text-white">{price}</span>
                </div>
                <button 
                    onClick={(e) => {
                        e.preventDefault(); 
                        isVar ? window.location.href=`#/product/${product.id}` : addToCart(product);
                    }} 
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-primary hover:text-black text-white flex items-center justify-center transition-all shadow-lg active:scale-95"
                >
                    <i className={`fas ${isVar ? 'fa-arrow-right' : 'fa-cart-plus'}`}></i>
                </button>
              </div>
          </div>
       </div>
    </motion.div>
  );
};
