
import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Helmet } from 'react-helmet-async';
import { config } from '../config';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
        setLoading(true);
        // By calling 'all', we utilize the new in-memory cache from api.ts
        // This makes search subsequent requests instantaneous.
        const all = await api.getProducts('all');
        setProducts(all);
        setLoading(false);
    };
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!query) return [];
    const lowerQ = query.toLowerCase();
    return products.filter(p => 
        p.name.toLowerCase().includes(lowerQ) || 
        p.categories.some(c => c.name.toLowerCase().includes(lowerQ)) ||
        p.tags.some(t => t.name.toLowerCase().includes(lowerQ))
    );
  }, [query, products]);

  return (
    <div className="min-h-screen bg-transparent pb-20 pt-24">
       <Helmet><title>Search: {query} | {config.siteName}</title></Helmet>
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 border-b border-white/10 pb-6">
              <p className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-2">Search Results</p>
              <h1 className="text-3xl md:text-5xl font-black text-white italic uppercase">
                  "{query}" <span className="text-primary not-italic text-2xl align-middle">({filteredProducts.length})</span>
              </h1>
          </div>

          {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[1,2,3,4].map(i => (
                     <div key={i} className="bg-dark-900 h-96 rounded-xl border border-white/5 animate-pulse"></div>
                 ))}
             </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
                {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-20 border border-white/5 rounded-2xl bg-dark-900/50">
               <i className="fas fa-search text-4xl text-gray-600 mb-4"></i>
               <h3 className="text-xl font-bold text-white mb-2">No matches found</h3>
               <p className="text-gray-400 max-w-md mx-auto mb-6">We couldn't find anything matching "{query}". Try checking for typos or use broader terms.</p>
               <Link to="/" className="bg-white/5 hover:bg-primary hover:text-black text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-colors inline-block">
                   View All Products
               </Link>
            </div>
          )}
       </div>
    </div>
  );
};
