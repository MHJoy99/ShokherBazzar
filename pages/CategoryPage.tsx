
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api'; 
import { Product, Category } from '../types'; 
import { ProductCard } from '../components/ProductCard';
import { Helmet } from 'react-helmet-async';
import { config } from '../config';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryInfo, setCategoryInfo] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      window.scrollTo(0, 0);
      if (slug) {
        const [prods, cats] = await Promise.all([
          api.getProducts(slug === 'all' ? 'all' : slug),
          api.getCategories()
        ]);
        setProducts(prods);
        setCategoryInfo(cats.find(c => c.slug === slug) || { id: 0, name: slug || 'Unknown', slug: slug || '', count: prods.length });
      }
      setLoading(false);
    };
    fetchData();
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-dark-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary shadow-glow"></div></div>;

  return (
    <div className="min-h-screen bg-transparent pb-20 pt-24">
       <Helmet><title>{categoryInfo?.name || slug} - {config.siteName}</title></Helmet>
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 blur-[80px] rounded-full"></div>
             <h1 className="relative z-10 text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-4">{categoryInfo?.name || slug}</h1>
             <p className="relative z-10 text-gray-400 max-w-lg mx-auto">Browse our collection of {categoryInfo?.name} games and codes. Instant delivery guaranteed.</p>
          </div>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-20 border border-white/5 rounded-2xl bg-dark-900/50">
               <i className="fas fa-ghost text-4xl text-gray-600 mb-4"></i>
               <p className="text-gray-400">No products found in this category.</p>
               <Link to="/" className="text-primary hover:underline mt-2 inline-block">Go Back Home</Link>
            </div>
          )}
       </div>
    </div>
  );
};
