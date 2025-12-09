
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api'; 
import { Product, Variation } from '../types'; 
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { config } from '../config';
import { SkeletonCard } from '../components/Skeleton';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  
  // Loading States
  const [loadingMain, setLoadingMain] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);

  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'redeem' | 'specs'>('desc');
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;
      
      // 1. FAST LOAD: Reset states and scroll up
      setLoadingMain(true);
      setLoadingRelated(true);
      setProduct(null);
      setRelatedProducts([]);
      setSuggestedProducts([]);
      window.scrollTo(0, 0);

      // 2. MAIN FETCH: Get only the product details first
      const data = await api.getProduct(parseInt(id));
      setProduct(data || null);
      if (data?.variations && data.variations.length > 0) setSelectedVariation(data.variations[0]);
      
      // 3. UNBLOCK UI: Stop loading immediately so user sees the page
      setLoadingMain(false);

      // 4. BACKGROUND FETCH: Get extra data (Related/Suggested) without blocking the user
      if (data) {
            try {
                // A. Related Cards (Sidebar)
                let related: Product[] = [];
                if (data.cross_sell_ids && data.cross_sell_ids.length > 0) {
                     related = await api.getProductsByIds(data.cross_sell_ids);
                } else if (data.categories.length > 0) {
                     // Optimization: Fetch fewer items
                     const categorySlug = data.categories[0].slug;
                     const allInCat = await api.getProducts(categorySlug); 
                     related = allInCat.filter(p => p.id !== data.id).slice(0, 8);
                }
                setRelatedProducts(related);

                // B. Suggested Products (Bottom)
                // Optimization: Instead of fetching 'all', fetch a different category or just use the remaining items from above
                // For now, we reuse the category fetch to avoid a massive DB call, or fetch 'gift-cards' as generic backup
                let suggestions = related.length > 4 ? related.slice(4, 8) : [];
                
                if (suggestions.length < 4) {
                    const generic = await api.getProducts('all'); // This might still be cached by browser
                    suggestions = generic
                        .filter(p => p.id !== data.id && !related.find(r => r.id === p.id))
                        .slice(0, 4);
                }
                setSuggestedProducts(suggestions);
            } catch (e) {
                console.warn("Background fetch failed", e);
            } finally {
                setLoadingRelated(false);
            }
      }
    };
    fetchProductData();
  }, [id]);

  if (loadingMain) return <div className="min-h-screen bg-dark-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary shadow-glow"></div></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-white">Product not found</div>;

  const isVariable = product.variations && product.variations.length > 0;
  
  // Price Calculation logic
  let displayPrice = "0";
  let regularPrice = "0";

  if (isVariable && selectedVariation) {
      displayPrice = selectedVariation.price;
      regularPrice = selectedVariation.regular_price || (parseFloat(selectedVariation.price) * 1.1).toFixed(0); 
  } else {
      displayPrice = product.on_sale && product.sale_price ? product.sale_price : product.price;
      regularPrice = product.regular_price;
  }
  
  const totalPrice = (parseFloat(displayPrice) * qty).toFixed(0);

  // Dynamic Content Logic
  const hasDisclaimer = product.short_description && product.short_description.trim().length > 0;
  const editionName = product.attributes?.find(a => a.name === 'Edition')?.options[0] || product.name;

  return (
    <div className="min-h-screen bg-transparent pb-32 pt-10">
      <Helmet><title>{product.name} | {config.siteName}</title></Helmet>
      
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[80vh] overflow-hidden pointer-events-none z-0">
         <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-950 to-dark-950"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-medium">
           <Link to="/" className="hover:text-primary transition-colors uppercase text-xs tracking-wider">Home</Link> <i className="fas fa-chevron-right text-[10px] opacity-50"></i> 
           <Link to={`/category/${product.categories[0]?.slug}`} className="hover:text-white transition-colors cursor-pointer uppercase text-xs tracking-wider">{product.categories[0]?.name}</Link> <i className="fas fa-chevron-right text-[10px] opacity-50"></i> 
           <span className="text-gray-300 uppercase text-xs tracking-wider font-bold">{product.name}</span>
        </nav>

        {/* HEADER SECTION (SEAGM Style) */}
        <div className="bg-gradient-to-r from-dark-800 to-dark-900 border border-white/5 rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 transform origin-bottom-right"></div>
             <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                 {/* Product Image Box */}
                 <div className="w-32 h-44 md:w-40 md:h-56 flex-shrink-0 bg-dark-950 rounded-xl overflow-hidden border-2 border-white/10 shadow-glow-sm">
                     <img src={product.images[0].src} alt={product.name} className="w-full h-full object-cover" />
                 </div>
                 
                 {/* Header Details */}
                 <div className="flex-1">
                     <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tight mb-4">{product.name}</h1>
                     
                     <div className="flex flex-wrap gap-3 mb-6">
                         {/* Dynamic Tags from WooCommerce */}
                         {product.tags && product.tags.length > 0 ? (
                             product.tags.map(tag => (
                                <span key={tag.id} className="flex items-center gap-2 bg-dark-950 border border-white/10 px-3 py-1.5 rounded text-xs font-bold text-gray-300 uppercase tracking-wide">
                                    <i className="fas fa-tag text-primary"></i> {tag.name}
                                </span>
                             ))
                         ) : (
                             // Fallback if no tags
                             <>
                                <span className="flex items-center gap-2 bg-dark-950 border border-white/10 px-3 py-1.5 rounded text-xs font-bold text-gray-300 uppercase tracking-wide">
                                    <img src="https://flagcdn.com/w20/bd.png" className="w-4 rounded-sm" alt="BD" /> Region: Global / BD
                                </span>
                                <span className="flex items-center gap-2 bg-dark-950 border border-white/10 px-3 py-1.5 rounded text-xs font-bold text-primary uppercase tracking-wide shadow-glow-sm">
                                    <i className="fas fa-bolt"></i> Instant Delivery
                                </span>
                             </>
                         )}
                         
                         {product.platform && (
                            <span className="flex items-center gap-2 bg-dark-950 border border-white/10 px-3 py-1.5 rounded text-xs font-bold text-gray-300 uppercase tracking-wide">
                                <i className="fas fa-gamepad"></i> {product.platform}
                            </span>
                         )}
                     </div>

                     {hasDisclaimer && (
                         <div className="bg-white/5 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                             <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                                 <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                                 <span className="font-bold text-gray-300">Important Note:</span> {product.short_description}
                             </p>
                         </div>
                     )}
                 </div>
             </div>
        </div>


        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: OPTIONS & DESCRIPTION (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-8">
             
             {/* VARIATION SELECTOR */}
             {isVariable ? (
                <div className="bg-dark-900 border border-white/5 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Select Denomination</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {product.variations!.map((variation) => {
                           const isSelected = selectedVariation?.id === variation.id;
                           return (
                            <button 
                                key={variation.id} 
                                onClick={() => { setSelectedVariation(variation); setQty(1); }} 
                                className={`relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 group overflow-hidden ${isSelected ? 'bg-primary/10 border-primary shadow-glow-sm' : 'bg-dark-950 border-white/5 hover:border-white/20'}`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-colors ${isSelected ? 'bg-primary text-black' : 'bg-dark-800 text-gray-500 group-hover:text-white'}`}>
                                        <i className={`fab fa-${product.platform?.toLowerCase() === 'steam' ? 'steam' : product.platform?.toLowerCase() === 'android' ? 'android' : 'playstation'}`}></i>
                                    </div>
                                    <div className="text-left">
                                        <div className={`font-bold text-sm uppercase tracking-wide ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{variation.name}</div>
                                        <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase"><i className="fas fa-bolt"></i> Instant</div>
                                    </div>
                                </div>
                                <div className="text-right relative z-10">
                                    <div className="text-xs text-gray-500 line-through font-mono">৳{variation.regular_price || (parseFloat(variation.price) * 1.1).toFixed(0)}</div>
                                    <div className={`text-lg font-black ${isSelected ? 'text-primary' : 'text-white'}`}>৳{variation.price}</div>
                                </div>
                                {isSelected && <div className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none"></div>}
                            </button>
                           );
                        })}
                    </div>
                </div>
             ) : (
                 // Single Product View (No Variations)
                 <div className="bg-dark-900 border border-white/5 rounded-2xl p-6 shadow-xl flex items-center gap-6">
                      <div className="w-16 h-16 bg-primary/20 text-primary rounded-xl flex items-center justify-center text-3xl"><i className="fas fa-check-circle"></i></div>
                      <div>
                          <h3 className="text-white font-bold text-lg uppercase">{editionName}</h3>
                      </div>
                      <div className="ml-auto text-right">
                          <div className="text-sm text-gray-500 line-through">৳{product.regular_price}</div>
                          <div className="text-3xl font-black text-white">৳{product.price}</div>
                      </div>
                 </div>
             )}

             {/* DESCRIPTION & TABS */}
             <div className="bg-dark-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                 <div className="flex border-b border-white/5 bg-dark-950/50">
                    {['desc', 'redeem', 'specs'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-dark-900 text-primary border-t-2 border-primary' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            {tab === 'desc' ? 'Description' : tab === 'redeem' ? 'How to Redeem' : 'Requirements'}
                        </button>
                    ))}
                 </div>
                 <div className="p-8">
                    <AnimatePresence mode='wait'>
                        {activeTab === 'desc' && (
                            <motion.div key="desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="prose prose-invert max-w-none text-sm text-gray-300">
                                <div dangerouslySetInnerHTML={{ __html: product.description }} />
                            </motion.div>
                        )}
                        {activeTab === 'redeem' && (
                            <motion.div key="redeem" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                <h4 className="text-white font-bold uppercase">Activation Guide</h4>
                                <ol className="list-decimal list-inside space-y-2 text-gray-400 text-sm">
                                    <li>Log in to your account for the respective platform.</li>
                                    <li>Navigate to "Redeem Code" or "Activate Product".</li>
                                    <li>Enter the code you received from us.</li>
                                    <li>Enjoy your content instantly!</li>
                                </ol>
                            </motion.div>
                        )}
                        {activeTab === 'specs' && (
                            <motion.div key="specs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <p className="text-gray-400 font-mono text-sm">System requirements are available on the official developer website.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                 </div>
             </div>
          </div>


          {/* RIGHT COLUMN: STICKY SIDEBAR (lg:col-span-4) */}
          <div className="lg:col-span-4">
             <div className="sticky top-24 space-y-6">
                
                {/* BUY CARD */}
                <div className="bg-dark-900 border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-600"></div>
                    
                    {/* Quantity */}
                    <div className="bg-dark-950 rounded-xl p-4 border border-white/5 mb-6 flex items-center justify-between">
                        <span className="text-gray-400 text-xs font-bold uppercase">Quantity</span>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setQty(Math.max(1, qty-1))} className="w-8 h-8 rounded bg-dark-800 hover:bg-white/10 text-white flex items-center justify-center transition-colors">-</button>
                            <span className="w-8 text-center font-black text-white">{qty}</span>
                            <button onClick={() => setQty(qty+1)} className="w-8 h-8 rounded bg-dark-800 hover:bg-white/10 text-white flex items-center justify-center transition-colors">+</button>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
                        <span className="text-gray-400 text-sm font-bold uppercase">Total Price</span>
                        <div className="text-right">
                             {parseFloat(regularPrice) > parseFloat(displayPrice) && (
                                 <div className="text-xs text-gray-500 line-through mb-1">৳{(parseFloat(regularPrice) * qty).toFixed(0)}</div>
                             )}
                             <div className="text-4xl font-black text-primary tracking-tight">৳{totalPrice}</div>
                             <div className="text-[10px] text-gray-500 font-mono mt-1">Credits Earned: {(parseFloat(totalPrice) * 0.01).toFixed(0)}</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button onClick={() => { addToCart(product, qty, selectedVariation || undefined); window.location.href = '#/cart'; }} className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase italic tracking-wider py-4 rounded-xl shadow-glow transition-all transform active:scale-95">
                            Buy Now
                        </button>
                        <button onClick={() => addToCart(product, qty, selectedVariation || undefined)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95">
                            <i className="fas fa-cart-plus"></i> Add to Cart
                        </button>
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5 justify-center">
                           <input type="checkbox" id="save" className="rounded bg-dark-950 border-white/10 text-primary focus:ring-0" />
                           <label htmlFor="save" className="text-xs text-gray-400 cursor-pointer hover:text-white">Save for future purchase</label>
                        </div>
                    </div>
                </div>

                {/* TRUST BADGES */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-dark-900 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                       <i className="fas fa-shield-alt text-green-500 text-xl"></i>
                       <div><div className="text-white text-xs font-bold">Secure</div><div className="text-[10px] text-gray-500">Encrypted</div></div>
                   </div>
                   <div className="bg-dark-900 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                       <i className="fas fa-headset text-yellow-500 text-xl"></i>
                       <div><div className="text-white text-xs font-bold">Support</div><div className="text-[10px] text-gray-500">24/7 Live</div></div>
                   </div>
                </div>

                {/* RELATED CARDS (SIDEBAR LIST) */}
                <div className="bg-dark-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl min-h-[100px]">
                    <div className="bg-dark-950 p-4 border-b border-white/5 flex justify-between items-center">
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider">Related Cards</h4>
                        {product.categories[0] && (
                            <Link to={`/category/${product.categories[0].slug}`} className="text-[10px] text-primary font-bold uppercase hover:underline">View All</Link>
                        )}
                    </div>
                    
                    {loadingRelated ? (
                        <div className="p-4 space-y-4">
                            {[1,2,3].map(i => <div key={i} className="h-12 bg-white/5 rounded animate-pulse"></div>)}
                        </div>
                    ) : relatedProducts.length > 0 ? (
                        <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                            {relatedProducts.map(p => (
                                <Link to={`/product/${p.id}`} key={p.id} className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group">
                                    <div className="w-10 h-10 rounded overflow-hidden bg-dark-950 border border-white/10 shrink-0">
                                            <img src={p.images[0].src} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-white text-xs font-bold truncate group-hover:text-primary transition-colors">{p.name}</h5>
                                        <div className="flex items-center gap-2 mt-1">
                                            {p.platform && <span className="text-[9px] bg-white/10 px-1 rounded text-gray-300">{p.platform}</span>}
                                            <span className="text-[9px] text-gray-500">Global</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-primary text-xs font-bold">৳{p.price}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500 text-xs">No related items.</div>
                    )}
                </div>

             </div>
          </div>

        </div>

        {/* SUGGESTED PRODUCTS (BOTTOM GRID) */}
        <div className="mt-24 border-t border-white/5 pt-12">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white uppercase italic tracking-wide">You Might Also Like</h2>
            </div>
            
            {loadingRelated ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                     {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
                 </div>
            ) : suggestedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{suggestedProducts.map(p => (<ProductCard key={p.id} product={p} />))}</div>
            ) : (
                <p className="text-gray-500">No suggestions available.</p>
            )}
        </div>
      </div>
      
      {/* MOBILE STICKY FOOTER */}
      <div className="fixed bottom-0 left-0 w-full bg-dark-900 border-t border-white/10 p-4 z-50 md:hidden flex items-center justify-between gap-4 shadow-2xl">
          <div><p className="text-[10px] text-gray-500 uppercase font-bold">Total</p><p className="text-xl font-black text-white">৳{totalPrice}</p></div>
          <button onClick={() => { addToCart(product, qty, selectedVariation || undefined); window.location.href = '#/cart'; }} className="bg-primary text-black font-black uppercase italic py-3 px-8 rounded shadow-glow flex-1">Buy Now</button>
      </div>
    </div>
  );
};
