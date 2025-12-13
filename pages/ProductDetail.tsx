
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api'; 
import { Product, Variation, CalculatorInfo, CalculatorResult } from '../types'; 
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { config } from '../config';
import { SkeletonCard } from '../components/Skeleton';
import { ProductCard } from '../components/ProductCard';

// --- CONFIG: SUPPORTED CURRENCIES ---
const CURRENCY_MAP: Record<string, { label: string; flag: string }> = {
    USD: { label: "USD", flag: "🇺🇸" },
    BDT: { label: "BDT", flag: "🇧🇩" },
    UAH: { label: "UAH", flag: "🇺🇦" }, 
    INR: { label: "INR", flag: "🇮🇳" }, 
    TRY: { label: "TRY", flag: "🇹🇷" }, 
    ARS: { label: "ARS", flag: "🇦🇷" }, 
    EUR: { label: "EUR", flag: "🇪🇺" },  
    BRL: { label: "BRL", flag: "🇧🇷" },  
    PLN: { label: "PLN", flag: "🇵🇱" },  
};

// --- BACKEND CONNECTED CALCULATOR ---
const GiftCardCalculator: React.FC<{ variations: Variation[], product: Product }> = ({ variations, product }) => {
    const [target, setTarget] = useState<string>('');
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [calcInfo, setCalcInfo] = useState<CalculatorInfo | null>(null);

    const [result, setResult] = useState<CalculatorResult | null>(null);
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState('');
    const { addToCart } = useCart();
    const { showToast } = useToast();

    // Fetch official display rate for UI hint
    useEffect(() => {
        const fetchBackendInfo = async () => {
             const info = await api.getCalculatorInfo(product.id);
             if (info) setCalcInfo(info);
        };
        fetchBackendInfo();
    }, [product.id]);

    const handleCalculate = async () => {
        const rawVal = parseFloat(target);
        if (!rawVal || rawVal <= 0) {
            setError("Enter a valid amount.");
            setResult(null);
            return;
        }
        setError('');
        setCalculating(true);
        setResult(null);

        // Call Backend
        const data = await api.calculateBundle(product.id, rawVal, selectedCurrency);
        
        if (data && data.success) {
            setResult(data);
        } else {
            setError(data?.message || "No valid combination found for this amount.");
        }
        setCalculating(false);
    };

    const handleAddBundle = () => {
        if(!result || !result.items) return;
        
        // Loop through items returned by Backend
        result.items.forEach((item: any) => {
            const variation = variations.find(v => v.id === item.variation_id);
            
            if (variation) {
                // SECURITY: Capture the token from response
                const bundleInfo = result.calculation_token ? {
                    token: result.calculation_token,
                    productId: product.id,
                    amount: result.requested_amount,
                    currency: result.currency 
                } : undefined;

                addToCart(
                    product, 
                    item.quantity, 
                    variation, 
                    item.unit_price_bdt.toString(), // Use backend's BDT price
                    bundleInfo // Pass security token
                );
            }
        });
        showToast(`Added bundle to cart!`, 'success');
    };

    return (
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-white/10 rounded-xl p-6 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <i className="fas fa-calculator text-6xl text-white"></i>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4 relative z-10">
                <div className="flex-1 w-full">
                    <h3 className="text-white font-bold uppercase text-sm mb-1"><i className="fas fa-magic text-primary mr-2"></i>Smart Calculator</h3>
                    <p className="text-xs text-gray-400">Enter amount in <span className="text-white font-bold">ANY Currency</span>.</p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                     <select 
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        className="bg-dark-950 border border-white/10 rounded-lg px-3 text-white text-xs font-bold outline-none"
                     >
                         {Object.entries(CURRENCY_MAP).map(([code, info]) => (
                             <option key={code} value={code}>{info.flag} {code}</option>
                         ))}
                     </select>
                     
                     <input 
                        type="number" 
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                        placeholder="Amount" 
                        className="bg-dark-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm w-full md:w-32 focus:border-primary outline-none" 
                     />
                     
                     <button 
                        onClick={handleCalculate} 
                        disabled={calculating}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors"
                     >
                        {calculating ? '...' : 'Find'}
                     </button>
                </div>
            </div>
            
            {/* Optional Rate Hint */}
            {selectedCurrency === 'BDT' && calcInfo && calcInfo.exchange_rate > 0 && (
                <p className="text-[10px] text-gray-400 font-mono mb-4 ml-1">
                    <i className="fas fa-info-circle mr-1"></i> Official Rate: 1 USD ≈ {calcInfo.exchange_rate} BDT
                </p>
            )}

            {error && <p className="text-red-400 text-xs mt-2 bg-red-500/10 p-2 rounded">{error}</p>}

            {result && (
                <div className="mt-4 bg-black/20 p-4 rounded-lg animate-fade-in-up">
                    <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                        <span className="text-white text-sm font-bold block">
                             Bundle Result {result.match_type === 'exact' ? <span className="text-green-500 text-[10px] ml-2">(Exact Match)</span> : <span className="text-yellow-500 text-[10px] ml-2">(Closest Match)</span>}
                        </span>
                        <span className="text-xs text-primary font-bold">Total: ৳{result.total_bdt}</span>
                    </div>
                    
                    {/* Item Breakdown */}
                    <div className="space-y-1 mb-4">
                        {result.items && result.items.map((item: any, idx: number) => (
                             <div key={idx} className="flex justify-between items-center text-xs text-gray-300">
                                 <span>{item.quantity}x {item.name}</span>
                                 <span>৳{item.subtotal_bdt}</span>
                             </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="text-[10px] text-gray-400">
                            {result.conversion && <span>{result.conversion.original_amount} {result.conversion.original_currency} ≈ ${result.conversion.converted_amount} USD</span>}
                        </div>
                        <button onClick={handleAddBundle} className="bg-primary text-black text-xs font-bold px-4 py-2 rounded hover:bg-white transition-colors uppercase">
                            Add Bundle
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const preload = location.state?.preload as Product | undefined;

  const [product, setProduct] = useState<Product | null>(preload || null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!preload); 
  
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [playerId, setPlayerId] = useState('');
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'redeem' | 'specs'>('desc');

  const { addToCart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProductData = async () => {
      if (!slug) return;
      setLoading(true);
      setRelatedProducts([]);
      window.scrollTo(0, 0);

      const data = await api.getProduct(slug);
      setProduct(data || null);
      if (data?.variations && data.variations.length > 0) {
          setSelectedVariation(data.variations[0]);
      }
      setLoading(false);

      if (data) {
          try {
             const all = await api.getProducts('all');
             const related = all.filter(p => p.categories[0]?.id === data.categories[0]?.id && p.id !== data.id).slice(0, 4);
             setRelatedProducts(related);
          } catch(e) {}
      }
    };
    fetchProductData();
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-dark-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary shadow-glow"></div></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-white">Product not found</div>;

  const isVariable = product.variations && product.variations.length > 0;
  const isGiftCard = isVariable && product.variations!.some(v => /\d/.test(v.name)); 
  const isTopUp = product.categories.some(c => c.slug.includes('top-up') || c.slug.includes('mobile') || c.slug.includes('game')); 

  // Price Logic
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

  const handleAddToCart = (buyNow: boolean) => {
      if (isVariable && !selectedVariation) {
          showToast("Please select a package first", "error");
          return;
      }
      if (isTopUp && !playerId && !isGiftCard) {
           showToast("Please enter your Player ID / Account Info", "error");
           document.getElementById('playerIdInput')?.focus();
           return;
      }

      const productToAdd = { ...product };
      if (playerId) {
          productToAdd.name = `${product.name} [ID: ${playerId}]`;
      }

      addToCart(productToAdd, qty, selectedVariation || undefined);
      
      if (buyNow) {
          navigate('/cart');
      }
  };

  return (
    <div className="min-h-screen bg-transparent pb-32 pt-24">
      <Helmet><title>{product.name} | {config.siteName}</title></Helmet>
      
      {/* BACKGROUND */}
      <div className="fixed top-0 left-0 w-full h-[80vh] overflow-hidden pointer-events-none z-0">
         <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-950 to-dark-950"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6 font-medium uppercase tracking-wider">
           <Link to="/" className="hover:text-primary transition-colors">Home</Link> <i className="fas fa-chevron-right text-[8px] opacity-50"></i> 
           <Link to={`/category/${product.categories[0]?.slug}`} className="hover:text-white transition-colors">{product.categories[0]?.name}</Link> <i className="fas fa-chevron-right text-[8px] opacity-50"></i> 
           <span className="text-gray-300 font-bold text-white">{product.name}</span>
        </nav>

        {/* HEADER BANNER WITH SHORT DESC (Important Note) */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl mb-8 bg-dark-900 border border-white/5 h-auto min-h-[250px]">
             <div 
                className="absolute inset-0 bg-cover bg-center blur-xl opacity-40 scale-110" 
                style={{ backgroundImage: `url(${product.images[0].src})` }}
             ></div>
             <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/80 to-transparent"></div>
             
             <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
                 <div className="w-24 h-32 md:w-40 md:h-56 bg-dark-950 rounded-xl overflow-hidden border-2 border-white/10 shadow-glow-sm shrink-0">
                     <img src={product.images[0].src} className="w-full h-full object-cover" alt={product.name} />
                 </div>
                 
                 <div className="flex-1 text-center md:text-left">
                     <h1 className="text-2xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4 drop-shadow-lg">{product.name}</h1>
                     
                     <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-start mb-6">
                         {product.tags && product.tags.length > 0 ? (
                             product.tags.map(tag => (
                                <span key={tag.id} className="flex items-center gap-2 bg-black/40 backdrop-blur border border-white/10 px-3 py-1 rounded text-[10px] md:text-xs font-bold text-white uppercase tracking-wide">
                                    <i className="fas fa-tag text-primary"></i> {tag.name}
                                </span>
                             ))
                         ) : (
                             <>
                                <span className="flex items-center gap-2 bg-black/40 backdrop-blur border border-white/10 px-3 py-1 rounded text-[10px] md:text-xs font-bold text-white uppercase tracking-wide">
                                    <i className="fas fa-globe-asia text-primary"></i> Global
                                </span>
                                <span className="flex items-center gap-2 bg-black/40 backdrop-blur border border-white/10 px-3 py-1 rounded text-[10px] md:text-xs font-bold text-white uppercase tracking-wide">
                                    <i className="fas fa-bolt text-yellow-400"></i> Instant
                                </span>
                             </>
                         )}
                     </div>

                     {/* SHORT DESCRIPTION RESTORED */}
                     {product.short_description && (
                         <div className="bg-white/5 border-l-4 border-yellow-500 p-4 rounded-r-lg text-left backdrop-blur-sm">
                             <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
                                 <i className="fas fa-info-circle text-yellow-500 mr-2"></i>
                                 <span className="font-bold text-white uppercase mr-1">Important:</span> 
                                 <span dangerouslySetInnerHTML={{ __html: product.short_description }}></span>
                             </p>
                         </div>
                     )}
                 </div>
             </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-8 space-y-8">
                
                {/* 1. CALCULATOR (Using Backend Logic) */}
                {isGiftCard && (
                    <GiftCardCalculator variations={product.variations!} product={product} />
                )}

                {/* 2. VARIATION GRID (Specific Styled Buttons Restored) */}
                <div className="bg-dark-900 border border-white/5 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                        Select Denomination
                    </h3>
                    
                    {isVariable ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {product.variations!.map((variation) => {
                               const isSelected = selectedVariation?.id === variation.id;
                               // Extract platform for icon logic
                               const platformIcon = product.platform?.toLowerCase().includes('steam') ? 'fa-steam' : 
                                                    product.platform?.toLowerCase().includes('xbox') ? 'fa-xbox' : 
                                                    product.platform?.toLowerCase().includes('playstation') ? 'fa-playstation' : 'fa-gamepad';
                               return (
                                <button 
                                    key={variation.id} 
                                    onClick={() => { setSelectedVariation(variation); setQty(1); }} 
                                    className={`
                                        relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 group overflow-hidden text-left
                                        ${isSelected 
                                            ? 'bg-primary/10 border-primary shadow-glow-sm' 
                                            : 'bg-dark-950 border-white/5 hover:border-white/20 hover:bg-white/5'}
                                    `}
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-colors ${isSelected ? 'bg-primary text-black' : 'bg-dark-800 text-gray-500 group-hover:text-white'}`}>
                                            <i className={`fab ${platformIcon}`}></i>
                                        </div>
                                        <div>
                                            <div className={`font-bold text-sm uppercase tracking-wide ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{variation.name}</div>
                                            <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase"><i className="fas fa-bolt"></i> Instant</div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right relative z-10">
                                        {variation.regular_price && <div className="text-[10px] text-gray-500 line-through">৳{variation.regular_price}</div>}
                                        <div className={`text-lg font-black ${isSelected ? 'text-primary' : 'text-white'}`}>
                                            ৳{variation.price}
                                        </div>
                                    </div>
                                    
                                    {isSelected && <div className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none"></div>}
                                </button>
                               );
                            })}
                        </div>
                    ) : (
                        <div className="bg-dark-950 border border-white/10 rounded-xl p-6 flex items-center justify-between">
                             <span className="text-white font-bold">{product.name}</span>
                             <span className="text-2xl font-black text-primary">৳{product.price}</span>
                        </div>
                    )}
                </div>

                {/* 3. TABBED DESCRIPTION SECTION RESTORED */}
                <div className="bg-dark-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                     <div className="flex border-b border-white/5 bg-dark-950/50">
                        {['desc', 'redeem', 'specs'].map((tab) => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab as any)} 
                                className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-dark-900 text-primary border-t-2 border-primary' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                {tab === 'desc' ? 'Description' : tab === 'redeem' ? 'How to Redeem' : 'Requirements'}
                            </button>
                        ))}
                     </div>
                     <div className="p-8 min-h-[200px]">
                        <AnimatePresence mode='wait'>
                            {activeTab === 'desc' && (
                                <motion.div key="desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="prose prose-invert prose-sm max-w-none text-gray-400">
                                    <div dangerouslySetInnerHTML={{ __html: product.description }} />
                                </motion.div>
                            )}
                            {activeTab === 'redeem' && (
                                <motion.div key="redeem" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                    <h4 className="text-white font-bold uppercase mb-4">Activation Guide</h4>
                                    <ol className="list-decimal list-inside space-y-3 text-gray-400 text-sm">
                                        <li>Log in to your account for the respective platform (Steam, Xbox, etc.).</li>
                                        <li>Navigate to the "Redeem Code" or "Activate Product" section in your account settings.</li>
                                        <li>Enter the code you received from us exactly as shown.</li>
                                        <li>Confirm the redemption and enjoy your content instantly!</li>
                                    </ol>
                                </motion.div>
                            )}
                            {activeTab === 'specs' && (
                                <motion.div key="specs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <div className="bg-dark-950 p-6 rounded-xl border border-white/5 text-center">
                                        <i className="fas fa-desktop text-4xl text-gray-600 mb-4"></i>
                                        <p className="text-gray-400 font-bold">System Requirements</p>
                                        <p className="text-gray-500 text-xs mt-2">Please refer to the official developer website for the most up-to-date system requirements.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                     </div>
                </div>
            </div>

            {/* RIGHT COLUMN: STICKY ORDER PANEL */}
            <div className="lg:col-span-4">
                <div className="sticky top-24 space-y-6">
                    
                    <div className="bg-dark-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="bg-dark-950 p-4 border-b border-white/5">
                            <h3 className="text-white font-bold text-sm uppercase tracking-widest">
                                Order Summary
                            </h3>
                        </div>
                        <div className="p-6 space-y-6">
                            
                            {/* Player ID Input */}
                            {isTopUp && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                                        Player ID / Account Info <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        id="playerIdInput"
                                        type="text" 
                                        value={playerId}
                                        onChange={(e) => setPlayerId(e.target.value)}
                                        placeholder="Enter Player ID / UID" 
                                        className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none transition-colors font-mono text-sm"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Double check your ID.</p>
                                </div>
                            )}

                            {/* Selection Summary */}
                            <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs text-gray-400 font-bold uppercase">Item</span>
                                    <span className="text-xs text-white font-bold text-right max-w-[150px] truncate">
                                        {isVariable && selectedVariation ? selectedVariation.name : product.name}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-400 font-bold uppercase">Price</span>
                                    <span className="text-white font-bold">৳{displayPrice}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400 font-bold uppercase">Qty</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setQty(Math.max(1, qty-1))} className="w-5 h-5 rounded bg-dark-950 text-gray-400 hover:text-white flex items-center justify-center">-</button>
                                        <span className="text-xs text-white font-bold">{qty}</span>
                                        <button onClick={() => setQty(qty+1)} className="w-5 h-5 rounded bg-dark-950 text-gray-400 hover:text-white flex items-center justify-center">+</button>
                                    </div>
                                </div>
                            </div>

                            {/* Total & Actions */}
                            <div className="border-t border-white/5 pt-4">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-sm font-bold text-gray-300 uppercase">Total</span>
                                    <span className="text-3xl font-black text-primary">৳{totalPrice}</span>
                                </div>
                                
                                <button 
                                    onClick={() => handleAddToCart(true)}
                                    className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase py-4 rounded-xl shadow-glow transition-all active:scale-95 mb-3"
                                >
                                    Buy Now
                                </button>
                                
                                <button 
                                    onClick={() => handleAddToCart(false)}
                                    className="w-full bg-[#0070BA] hover:bg-[#005ea6] text-white font-bold uppercase py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <i className="fas fa-cart-plus"></i> Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RELATED CARDS */}
                    {relatedProducts.length > 0 && (
                        <div className="bg-dark-900 border border-white/5 rounded-2xl p-4">
                            <h4 className="text-white font-bold text-xs uppercase mb-4 tracking-wider">Related Cards</h4>
                            <div className="space-y-3">
                                {relatedProducts.map(p => (
                                    <Link to={`/product/${p.slug}`} key={p.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group">
                                        <img src={p.images[0].src} className="w-10 h-10 rounded object-cover border border-white/10" alt="" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-xs font-bold truncate group-hover:text-primary">{p.name}</p>
                                            <p className="text-[10px] text-gray-500">Global</p>
                                        </div>
                                        <span className="text-primary text-xs font-bold">৳{p.price}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
