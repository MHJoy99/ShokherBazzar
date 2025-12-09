
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api'; 
import { Product, Category } from '../types'; 
import { ProductCard } from '../components/ProductCard';
import { Hero } from '../components/Hero'; 
import { SkeletonCard, SkeletonHero } from '../components/Skeleton';
import { Helmet } from 'react-helmet-async';
import { config } from '../config';

const TESTIMONIALS = [
  { id: 1, name: "Rahim Ahmed", role: "Gamer, Dhaka", text: "Got my Steam Wallet code in 30 seconds via bKash. Best site!", rating: 5, color: "border-blue-500" },
  { id: 2, name: "Nusrat Jahan", role: "Student, Ctg", text: "Trusted service for Google Play cards. Support is very helpful.", rating: 5, color: "border-pink-500" },
  { id: 3, name: "Tanvir Hasan", role: "Streamer, Sylhet", text: "Free Fire diamonds prices are unbeatable here. Highly recommend.", rating: 5, color: "border-orange-500" },
  { id: 4, name: "Karim Ullah", role: "Rajshahi", text: "Fastest delivery I have ever seen for Xbox Game Pass.", rating: 4, color: "border-green-500" },
  { id: 5, name: "Sadiya Islam", role: "Dhaka", text: "Finally a site that accepts Nagad properly. Thank you!", rating: 5, color: "border-yellow-500" },
];

export const Home: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGenre, setFilterGenre] = useState<string>('All Genres');
  const [filterPlatform, setFilterPlatform] = useState<string>('All Platforms');
  const [showBrowseAll, setShowBrowseAll] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [prods, cats] = await Promise.all([
          api.getProducts('all'),
          api.getCategories()
        ]);
        setAllProducts(prods);
        setCategories(cats);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const heroProducts = useMemo(() => {
    // 1. Try to find products marked as "Featured" in WooCommerce
    const featured = allProducts.filter(p => p.featured);
    // 2. If there are featured products, use them. Otherwise, use the first 5 recent products.
    return featured.length > 0 ? featured : allProducts.slice(0, 5);
  }, [allProducts]);

  const productsByCategory = useMemo(() => {
    const grouped: Record<string, Product[]> = {};
    categories.forEach(c => { grouped[c.name] = []; });
    allProducts.forEach(product => {
        if (product.categories && product.categories.length > 0) {
            const primaryCat = product.categories[0].name;
            if (!grouped[primaryCat]) grouped[primaryCat] = [];
            grouped[primaryCat].push(product);
        }
    });
    Object.keys(grouped).forEach(key => { if (grouped[key].length === 0) delete grouped[key]; });
    return grouped;
  }, [allProducts, categories]);

  const browseAllProducts = useMemo(() => {
    return allProducts.filter(p => {
      const matchesGenre = filterGenre === 'All Genres' || p.categories.some(c => c.name === filterGenre);
      const matchesPlatform = filterPlatform === 'All Platforms' || p.platform === filterPlatform;
      return matchesGenre && matchesPlatform;
    });
  }, [allProducts, filterGenre, filterPlatform]);

  const genreOptions = ['All Genres', ...categories.map(c => c.name)];

  return (
    <div className="min-h-screen bg-transparent pb-20">
      <Helmet>
         <title>{config.siteName} - Buy Game Codes & Cards</title>
         <meta name="description" content={config.siteDescription} />
      </Helmet>
      
      {loading ? <SkeletonHero /> : <Hero products={heroProducts} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
        <section>
            <div className="flex items-end justify-between mb-8">
               <div>
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-wider"><span className="text-primary">Shop</span> By Platform</h2>
                   <div className="h-1 w-24 bg-primary mt-2"></div>
               </div>
               <Link to="/category/all" className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest border border-white/10 px-4 py-2 rounded hover:bg-white/5 transition-all">View All Platforms</Link>
            </div>
            
            {/* PLATFORM GRID USING CONFIG */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {config.platformCategories.map((cat, idx) => (
                    <Link key={idx} to={`/category/${cat.slug}`} className="group relative h-36 rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all shadow-lg hover:shadow-glow-sm">
                        <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-40 group-hover:opacity-80 transition-opacity`}></div>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <div className="relative z-10 h-full flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <i className={`${cat.icon} text-3xl text-white drop-shadow-lg`}></i>
                            </div>
                            <span className="font-bold text-white uppercase tracking-wider text-xs">{cat.name}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>

        <section className="relative rounded-3xl overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-indigo-900"></div>
            <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            <div className="relative z-10 p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="text-center md:text-left">
                    <span className="bg-yellow-500 text-black font-black text-xs px-3 py-1 uppercase rounded-sm mb-4 inline-block transform -rotate-2 shadow-lg">Limited Time Offer</span>
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-2 italic uppercase leading-none">Summer <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Madness</span> Sale</h2>
                    <p className="text-gray-200 text-lg max-w-md mt-4">Get up to <b className="text-white">40% OFF</b> on all Steam Wallet Codes. Don't miss out!</p>
                </div>
            </div>
        </section>
        
        {loading ? (
             <div className="space-y-12">
                 {[1, 2].map(i => (
                     <div key={i}>
                         <div className="h-8 w-48 bg-white/5 rounded mb-8"></div>
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                             {[1,2,3,4,5].map(j => <SkeletonCard key={j} />)}
                         </div>
                     </div>
                 ))}
             </div>
        ) : (
            Object.entries(productsByCategory).map(([categoryName, products], index) => {
            const catObj = categories.find(c => c.name === categoryName);
            const slug = catObj ? catObj.slug : categoryName.toLowerCase().replace(/\s+/g, '-');
            return (
                <React.Fragment key={categoryName}>
                    <section id={`cat-${slug}`} className="scroll-mt-40 relative">
                    <div className="absolute -left-4 -top-4 w-20 h-20 bg-primary/5 rounded-full blur-3xl"></div>
                    <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-3">
                                <i className={`fas ${categoryName === 'Gift Cards' ? 'fa-gift' : 'fa-gamepad'} text-primary`}></i>
                                {categoryName}
                            </h2>
                        </div>
                        <Link to={`/category/${slug}`} className="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white uppercase tracking-wider transition-colors">
                        View All <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors"><i className="fas fa-chevron-right text-[8px]"></i></span>
                        </Link>
                    </div>
                    <div className="flex gap-5 overflow-x-auto pb-8 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                        {products.map(product => (
                        <div key={product.id} className="min-w-[220px] md:min-w-[260px] snap-start h-full">
                            <ProductCard product={product} />
                        </div>
                        ))}
                    </div>
                    </section>
                    {index === 0 && (
                        <section className="bg-dark-900 border border-white/5 rounded-2xl p-8 md:p-12 relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-green-900/40 to-transparent"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center shadow-glow">
                                        <i className="fab fa-xbox text-3xl text-white"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase italic">Xbox Game Pass Ultimate</h3>
                                        <p className="text-gray-400 text-sm">Play 100+ high-quality games with friends.</p>
                                    </div>
                                </div>
                                <Link to="/category/gift-cards" className="bg-white text-black font-black uppercase px-6 py-3 rounded-lg hover:scale-105 transition-transform">Restock Now</Link>
                            </div>
                        </section>
                    )}
                </React.Fragment>
            );
            })
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-dark-900 border border-white/5 p-6 rounded-2xl flex items-center gap-4 hover:border-primary/30 transition-colors group">
                <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 text-2xl group-hover:scale-110 transition-transform"><i className="fas fa-bolt"></i></div>
                <div><h4 className="font-bold text-white">Instant Delivery</h4><p className="text-xs text-gray-500 mt-1">Codes sent automatically within seconds.</p></div>
            </div>
            <div className="bg-dark-900 border border-white/5 p-6 rounded-2xl flex items-center gap-4 hover:border-green-500/30 transition-colors group">
                <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 text-2xl group-hover:scale-110 transition-transform"><i className="fas fa-shield-alt"></i></div>
                <div><h4 className="font-bold text-white">Official Reseller</h4><p className="text-xs text-gray-500 mt-1">100% legitimate codes directly from publishers.</p></div>
            </div>
            <div className="bg-dark-900 border border-white/5 p-6 rounded-2xl flex items-center gap-4 hover:border-pink-500/30 transition-colors group">
                <div className="w-14 h-14 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-400 text-2xl group-hover:scale-110 transition-transform"><i className="fas fa-wallet"></i></div>
                <div><h4 className="font-bold text-white">Local Payments</h4><p className="text-xs text-gray-500 mt-1">Pay with bKash, Nagad, and Local Bank.</p></div>
            </div>
            <div className="bg-dark-900 border border-white/5 p-6 rounded-2xl flex items-center gap-4 hover:border-yellow-500/30 transition-colors group">
                <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400 text-2xl group-hover:scale-110 transition-transform"><i className="fas fa-headset"></i></div>
                <div><h4 className="font-bold text-white">24/7 Support</h4><p className="text-xs text-gray-500 mt-1">Real humans ready to help anytime.</p></div>
            </div>
        </section>

        <section className="bg-dark-950 border-y border-white/5 py-16 overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4 mb-10 text-center">
                 <h2 className="text-3xl font-black text-white uppercase italic tracking-wider mb-2">Community <span className="text-primary">Reviews</span></h2>
            </div>
            <div className="flex w-full">
                <div className="flex gap-6 animate-marquee whitespace-nowrap px-6">
                    {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                        <div key={i} className={`w-[350px] bg-dark-900 p-6 rounded-2xl border ${t.color} border-opacity-30 border-l-4 shrink-0 whitespace-normal`}>
                            <div className="flex items-center gap-1 text-yellow-400 text-xs mb-3">
                                {[...Array(t.rating)].map((_, idx) => <i key={idx} className="fas fa-star"></i>)}
                            </div>
                            <p className="text-gray-300 text-sm mb-4 italic leading-relaxed line-clamp-2">"{t.text}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 font-bold text-xs uppercase">{t.name.charAt(0)}</div>
                                <div><h4 className="text-white font-bold text-xs uppercase">{t.name}</h4><p className="text-[10px] text-gray-500 uppercase font-bold">{t.role}</p></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        <section id="browse-all" className="scroll-mt-32 pt-10">
           {!showBrowseAll ? (
              <div className="text-center py-6">
                  <button onClick={() => setShowBrowseAll(true)} className="group relative px-10 py-5 bg-dark-800 rounded-xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all shadow-lg">
                     <span className="relative text-gray-300 font-bold group-hover:text-white uppercase tracking-wider flex items-center gap-3 text-lg">View Complete Catalog <i className="fas fa-chevron-down text-sm"></i></span>
                  </button>
              </div>
           ) : (
             <div className="animate-fade-in-up">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                  <h2 className="text-3xl font-black text-white mb-2 uppercase">Full Catalog</h2>
                  <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} className="bg-dark-900 border border-dark-700 text-white py-3 px-6 rounded-lg text-sm focus:border-primary focus:outline-none font-bold uppercase">
                        {genreOptions.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
               </div>
               {browseAllProducts.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {browseAllProducts.map(product => (<ProductCard key={product.id} product={product} />))}
                 </div>
               ) : (
                 <div className="py-12 text-center border-2 border-dashed border-dark-800 rounded-2xl"><p className="text-gray-400 font-mono">No products found matching your filters.</p></div>
               )}
               <div className="text-center mt-12"><button onClick={() => setShowBrowseAll(false)} className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-wider">Collapse Catalog</button></div>
             </div>
           )}
        </section>
      </div>
    </div>
  );
};
