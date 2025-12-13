
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api'; 
import { Product, Variation } from '../types'; 
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { config } from '../config';
import { SkeletonCard } from '../components/Skeleton';
import { ProductCard } from '../components/ProductCard';

// --- CONFIG: SUPPORTED CURRENCIES & FALLBACK RATES ---
const CURRENCY_MAP: Record<string, { label: string; flag: string; fallback: number }> = {
    USD: { label: "USD", flag: "🇺🇸", fallback: 1 },
    UAH: { label: "UAH", flag: "🇺🇦", fallback: 41.60 }, // Ukraine
    INR: { label: "INR", flag: "🇮🇳", fallback: 84.10 }, // India
    TRY: { label: "TRY", flag: "🇹🇷", fallback: 34.25 }, // Turkey
    ARS: { label: "ARS", flag: "🇦🇷", fallback: 980.50 }, // Argentina
    EUR: { label: "EUR", flag: "🇪🇺", fallback: 0.93 },  // Euro
    BRL: { label: "BRL", flag: "🇧🇷", fallback: 5.75 },  // Brazil
    PLN: { label: "PLN", flag: "🇵🇱", fallback: 3.96 },  // Poland
};

// --- GIFT CARD CALCULATOR LOGIC (Quad Support + Flat Profit Rule) ---
interface CalcOption {
    denom: number;
    price: number;
    variation: Variation;
}

interface CalcResult {
    type: 'single' | 'pair' | 'triple' | 'quad';
    items: CalcOption[];
    totalDenom: number;
    totalPrice: number;
    bundlePrice: number;
    savings: number;
    originalTarget: number;
    currency: string;
}

const GiftCardCalculator: React.FC<{ variations: Variation[], product: Product }> = ({ variations, product }) => {
    const [target, setTarget] = useState<string>('');
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [conversionRates, setConversionRates] = useState<Record<string, number>>({});
    const [ratesLoaded, setRatesLoaded] = useState(false);
    
    const [result, setResult] = useState<CalcResult | null>(null);
    const [error, setError] = useState('');
    const { addToCart } = useCart();
    const { showToast } = useToast();

    // 0. Init Rates (Prioritize Live, Fallback to Hardcoded)
    useEffect(() => {
        // 1. Set Fallbacks immediately to prevent UI lag
        const initial: Record<string, number> = {};
        Object.entries(CURRENCY_MAP).forEach(([key, val]) => initial[key] = val.fallback);
        setConversionRates(initial);

        // 2. Attempt Live Fetch
        const fetchRates = async () => {
            try {
                const res = await fetch('https://api.frankfurter.app/latest?from=USD');
                if (!res.ok) throw new Error("Rate API failed");
                const data = await res.json();
                
                if (data && data.rates) {
                    setConversionRates(prev => ({ ...prev, ...data.rates }));
                    setRatesLoaded(true);
                }
            } catch (e) {
                console.warn("Currency API offline, using fallback rates.");
                // Fallback rates already set, so we just do nothing
            }
        };

        fetchRates();
    }, []);

    // 1. Parse Variations into usable numbers
    const options: CalcOption[] = useMemo(() => {
        return variations.map(v => {
            // SAFE MATCH: Ensure we don't crash if name has no numbers
            const match = v.name.match(/(\d+(\.\d+)?)/);
            const attrDenom = product.attributes?.find(a => a.name === 'pa_denomination')?.options.find(opt => v.name.includes(opt));
            
            let denom = match ? parseFloat(match[0]) : 0;
            if (denom === 0 && attrDenom) denom = parseFloat(attrDenom);
            
            const price = parseFloat(v.price);
            return (denom > 0 && price > 0) ? { denom, price, variation: v } : null;
        }).filter(Boolean) as CalcOption[];
    }, [variations, product]);

    const handleCalculate = () => {
        const rawVal = parseFloat(target);
        if (!rawVal || rawVal <= 0) {
            setError("Enter a valid amount.");
            setResult(null);
            return;
        }
        setError('');

        // CONVERSION LOGIC
        const exchangeRate = conversionRates[selectedCurrency] || 1;
        // If USD, target is direct. If other, convert Local -> USD
        const targetUSD = selectedCurrency === 'USD' ? rawVal : (rawVal / exchangeRate);

        // Helper: Find Best Single
        function findBestSingle(t: number) {
            let best = null, bestDiff = Infinity;
            options.forEach(opt => {
                const diff = Math.abs(opt.denom - t);
                if (diff < bestDiff) { bestDiff = diff; best = opt; }
            });
            return best ? { items: [best], total: best.denom } : null;
        }

        // Helper: Find Best Pair
        function findBestPair(t: number) {
            let bestPair = null, bestDiff = Infinity;
            for (let i = 0; i < options.length; i++) {
                for (let j = i; j < options.length; j++) {
                    const sum = options[i].denom + options[j].denom;
                    const diff = Math.abs(sum - t);
                    if (diff < bestDiff) { bestDiff = diff; bestPair = [options[i], options[j]]; }
                }
            }
            return bestPair ? { items: bestPair, total: bestPair.reduce((s,i)=>s+i.denom,0) } : null;
        }

        // Helper: Find Best Triple
        function findBestTriple(t: number) {
            let bestTriple = null, bestDiff = Infinity;
            for (let i = 0; i < options.length; i++) {
                for (let j = i; j < options.length; j++) {
                    for (let k = j; k < options.length; k++) {
                        const sum = options[i].denom + options[j].denom + options[k].denom;
                        const diff = Math.abs(sum - t);
                        if (diff < bestDiff) { bestDiff = diff; bestTriple = [options[i], options[j], options[k]]; }
                    }
                }
            }
            return bestTriple ? { items: bestTriple, total: bestTriple.reduce((s,i)=>s+i.denom,0) } : null;
        }

        // Helper: Find Best Quad
        function findBestQuad(t: number) {
            let bestQuad = null, bestDiff = Infinity;
            if(options.length > 25) return null; // Performance brake
            for (let i = 0; i < options.length; i++) {
                for (let j = i; j < options.length; j++) {
                    for (let k = j; k < options.length; k++) {
                        for (let m = k; m < options.length; m++) {
                            const sum = options[i].denom + options[j].denom + options[k].denom + options[m].denom;
                            const diff = Math.abs(sum - t);
                            if (diff < bestDiff) { bestDiff = diff; bestQuad = [options[i], options[j], options[k], options[m]]; }
                        }
                    }
                }
            }
            return bestQuad ? { items: bestQuad, total: bestQuad.reduce((s,i)=>s+i.denom,0) } : null;
        }

        const bestSingle = findBestSingle(targetUSD);
        const bestPair = findBestPair(targetUSD);
        const bestTriple = findBestTriple(targetUSD);
        const bestQuad = findBestQuad(targetUSD);

        const candidates = [];
        if (bestSingle) candidates.push(bestSingle);
        if (bestPair) candidates.push(bestPair);
        if (bestTriple) candidates.push(bestTriple);
        if (bestQuad) candidates.push(bestQuad);

        // Priority: Over20 -> Over -> Under
        let over20 = null, over = null, under = null;
        
        candidates.forEach(c => {
            const t = c.total;
            if (t >= targetUSD + 0.20) {
                if (!over20 || t < over20.total) over20 = c;
            } else if (t >= targetUSD) {
                if (!over || t < over.total) over = c;
            } else {
                if (!under || Math.abs(targetUSD - t) < Math.abs(targetUSD - under.total)) under = c;
            }
        });

        const chosen = over20 || over || under;

        if (chosen) {
            const items = chosen.items;
            const totalDenom = chosen.total;
            
            // 1. Calculate Standard Store Price (Sum of cards)
            const totalPrice = items.reduce((sum, i) => sum + i.price, 0); 
            
            // 2. FIXED PROFIT MARGIN LOGIC (CTO UPDATE)
            // Base Rate = 132 BDT per 1 USD
            const BASE_RATE = 132;
            const flatProfit = totalDenom < 3 ? 40 : 80;
            
            // New Bundle Price Calculation
            let calculatedBundlePrice = (totalDenom * BASE_RATE) + flatProfit;
            calculatedBundlePrice = Math.ceil(calculatedBundlePrice); // Round up to nearest integer

            // 3. Safety Check: If Store Price is cheaper than our formula (rare), use Store Price.
            // This prevents user from paying MORE than buying individually.
            const finalPrice = Math.min(totalPrice, calculatedBundlePrice);
            
            const savings = Math.max(0, totalPrice - finalPrice);

            setResult({
                type: items.length === 1 ? 'single' : items.length === 2 ? 'pair' : items.length === 3 ? 'triple' : 'quad',
                items,
                totalDenom,
                totalPrice,
                bundlePrice: finalPrice,
                savings,
                originalTarget: rawVal,
                currency: selectedCurrency
            });
        } else {
            setError("No combination found.");
        }
    };

    const handleAddBundle = () => {
        if(!result) return;
        result.items.forEach(item => {
            const customPrice = (item.denom / result.totalDenom) * result.bundlePrice;
            addToCart(product, 1, item.variation, customPrice.toString());
        });
        showToast(`Added ${result.items.length} items to cart!`, 'success');
    };

    if (options.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <i className="fas fa-calculator text-6xl text-white"></i>
            </div>
            
            <h3 className="text-xl font-black text-white uppercase italic mb-2 flex items-center gap-2">
                <i className="fas fa-magic text-yellow-400"></i> Smart Calculator
            </h3>
            <p className="text-gray-300 text-sm mb-6 max-w-lg">
                Enter amount in <span className="text-white font-bold">ANY Currency</span>. We'll find the best USD card combo for your region!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-4">
                <div className="relative flex-1 w-full sm:w-auto flex gap-2">
                    
                    {/* CURRENCY SELECTOR */}
                    <div className="relative min-w-[110px]">
                         <select 
                            value={selectedCurrency}
                            onChange={(e) => setSelectedCurrency(e.target.value)}
                            className="w-full h-full bg-dark-950 border border-white/10 rounded-xl pl-3 pr-8 py-3 text-white appearance-none focus:border-primary outline-none font-bold text-sm cursor-pointer shadow-inner"
                         >
                             {Object.entries(CURRENCY_MAP).map(([code, info]) => (
                                 <option key={code} value={code}>{info.flag} {code}</option>
                             ))}
                         </select>
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">
                             <i className="fas fa-chevron-down"></i>
                         </div>
                    </div>

                    <div className="relative flex-1">
                        <input 
                            type="number" 
                            step="0.01" 
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            placeholder={selectedCurrency === 'USD' ? "Amount (e.g. 18.49)" : `Amount in ${selectedCurrency}`}
                            className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary outline-none font-mono font-bold shadow-inner"
                        />
                    </div>
                </div>
                <button 
                    onClick={handleCalculate}
                    className="bg-primary hover:bg-primary-hover text-black font-black uppercase px-6 py-3 rounded-xl shadow-glow transition-transform active:scale-95 w-full sm:w-auto"
                >
                    Calculate
                </button>
            </div>

            {/* LIVE RATE INDICATOR */}
            {selectedCurrency !== 'USD' && conversionRates[selectedCurrency] && (
                <div className="flex items-center gap-2 mb-4">
                     <p className="text-[10px] text-gray-400 font-mono text-center sm:text-left bg-black/20 inline-block px-2 py-1 rounded border border-white/5">
                        <i className="fas fa-exchange-alt mr-1"></i>
                        1 USD ≈ {conversionRates[selectedCurrency]?.toFixed(2)} {selectedCurrency}
                     </p>
                     {ratesLoaded && <span className="text-[10px] text-green-500 font-bold animate-pulse">● Live Rates</span>}
                </div>
            )}

            {error && <p className="text-red-400 text-sm font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20"><i className="fas fa-exclamation-circle"></i> {error}</p>}

            {result && (
                <div className="bg-dark-950/80 border border-white/10 rounded-xl p-5 animate-fade-in-up shadow-2xl">
                     <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                         <div>
                             <p className="text-gray-400 text-xs uppercase font-bold">You Get (Approx)</p>
                             <p className="text-white font-bold text-lg mb-1">
                                 {result.currency === 'USD' ? (
                                     `$${result.totalDenom.toFixed(2)} USD`
                                 ) : (
                                     `${(result.totalDenom * (conversionRates[result.currency] || 1)).toFixed(0)} ${result.currency}`
                                 )}
                             </p>
                             
                             <div className="flex flex-wrap gap-2 mt-2">
                                 {result.items.map((item, idx) => (
                                     <span key={idx} className="bg-white/10 text-white font-mono font-bold px-2 py-1 rounded text-xs border border-white/10 flex items-center gap-1">
                                         <span className="text-[9px] text-gray-500">$</span>{item.denom}
                                     </span>
                                 ))}
                             </div>
                             
                             {result.currency !== 'USD' && (
                                <p className="text-gray-500 text-[10px] mt-2 italic">Actual Steam conversion may vary slightly.</p>
                             )}
                         </div>
                         <div className="text-right">
                             <p className="text-gray-400 text-xs uppercase font-bold">Your Price</p>
                             {result.savings > 0 && (
                                 <p className="text-xs text-red-400 line-through font-mono">৳{result.totalPrice.toFixed(0)}</p>
                             )}
                             <p className="text-2xl font-black text-primary">৳{result.bundlePrice.toFixed(0)}</p>
                             {result.savings > 0 && (
                                 <span className="bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase inline-block mt-1 animate-pulse">
                                     Save ৳{result.savings.toFixed(0)}
                                 </span>
                             )}
                         </div>
                     </div>
                     <button 
                        onClick={handleAddBundle}
                        className="w-full bg-green-500 hover:bg-green-400 text-black font-black uppercase py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/20"
                     >
                         <i className="fas fa-cart-plus"></i> Add Bundle to Cart
                     </button>
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

  // Optimistic UI: Init with preload if available
  const [product, setProduct] = useState<Product | null>(preload || null);
  
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  
  // Loading States
  const [loadingMain, setLoadingMain] = useState(!preload); 
  const [loadingRelated, setLoadingRelated] = useState(true);

  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'redeem' | 'specs'>('desc');
  const { addToCart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProductData = async () => {
      if (!slug) return;
      
      setLoadingRelated(true);
      // Only set loading if we don't have preload data
      if (!product) setLoadingMain(true);
      
      setRelatedProducts([]);
      setSuggestedProducts([]);
      window.scrollTo(0, 0);

      const data = await api.getProduct(slug);
      
      // Update product with full details (including variations)
      if (data) {
          setProduct(data);
          // Auto-select first variation if available
          if (data.variations && data.variations.length > 0) {
              setSelectedVariation(data.variations[0]);
          }
      }
      
      setLoadingMain(false);

      if (data) {
            try {
                // Related Cards
                let related: Product[] = [];
                if (data.cross_sell_ids && data.cross_sell_ids.length > 0) {
                     related = await api.getProductsByIds(data.cross_sell_ids);
                } else if (data.categories.length > 0) {
                     const categorySlug = data.categories[0].slug;
                     const allInCat = await api.getProducts(categorySlug); 
                     related = allInCat.filter(p => p.id !== data.id).slice(0, 8);
                }
                setRelatedProducts(related);

                // Suggested Products
                let suggestions = related.length > 4 ? related.slice(4, 8) : [];
                if (suggestions.length < 4) {
                    const generic = await api.getProducts('all'); 
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
  }, [slug]);

  if (loadingMain && !product) return <div className="min-h-screen bg-dark-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary shadow-glow"></div></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-white">Product not found</div>;

  const isVariable = product.type === 'variable' || (product.variations && product.variations.length > 0);
  // Check if variations are actually loaded
  const variationsLoaded = product.variations && product.variations.length > 0;
  
  // DETECT IF THIS IS A GIFT CARD (for calculator)
  const isGiftCard = isVariable && variationsLoaded && product.variations!.some(v => /\d/.test(v.name));

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
  const hasDisclaimer = product.short_description && product.short_description.trim().length > 0;
  const editionName = product.attributes?.find(a => a.name === 'Edition')?.options[0] || product.name;

  return (
    <div className="min-h-screen bg-transparent pb-32 pt-10">
      <Helmet><title>{product.name} | {config.siteName}</title></Helmet>
      
      <div className="fixed top-0 left-0 w-full h-[80vh] overflow-hidden pointer-events-none z-0">
         <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-950 to-dark-950"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-medium">
           <Link to="/" className="hover:text-primary transition-colors uppercase text-xs tracking-wider">Home</Link> <i className="fas fa-chevron-right text-[10px] opacity-50"></i> 
           <Link to={`/category/${product.categories[0]?.slug}`} className="hover:text-white transition-colors cursor-pointer uppercase text-xs tracking-wider">{product.categories[0]?.name}</Link> <i className="fas fa-chevron-right text-[10px] opacity-50"></i> 
           <span className="text-gray-300 uppercase text-xs tracking-wider font-bold">{product.name}</span>
        </nav>

        <div className="bg-gradient-to-r from-dark-800 to-dark-900 border border-white/5 rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 transform origin-bottom-right"></div>
             <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                 <div className="w-32 h-44 md:w-40 md:h-56 flex-shrink-0 bg-dark-950 rounded-xl overflow-hidden border-2 border-white/10 shadow-glow-sm">
                     <img src={product.images[0].src} alt={product.name} className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1">
                     <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tight mb-4">{product.name}</h1>
                     <div className="flex flex-wrap gap-3 mb-6">
                         {product.tags && product.tags.length > 0 ? (
                             product.tags.map(tag => (
                                <span key={tag.id} className="flex items-center gap-2 bg-dark-950 border border-white/10 px-3 py-1.5 rounded text-xs font-bold text-gray-300 uppercase tracking-wide">
                                    <i className="fas fa-tag text-primary"></i> {tag.name}
                                </span>
                             ))
                         ) : (
                             <>
                                <span className="flex items-center gap-2 bg-dark-950 border border-white/10 px-3 py-1.5 rounded text-xs font-bold text-gray-300 uppercase tracking-wide">
                                    <img src="https://flagcdn.com/w20/bd.png" className="w-4 rounded-sm" alt="BD" /> Region: Global / BD
                                </span>
                                <span className="flex items-center gap-2 bg-dark-950 border border-white/10 px-3 py-1.5 rounded text-xs font-bold text-primary uppercase tracking-wide shadow-glow-sm">
                                    <i className="fas fa-bolt"></i> Instant Delivery
                                </span>
                             </>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
             {/* GIFT CARD CALCULATOR - Only show if it looks like a gift card */}
             {isGiftCard && product.variations && (
                 <GiftCardCalculator variations={product.variations} product={product} />
             )}
             
             {isVariable ? (
                <div className="bg-dark-900 border border-white/5 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Select Denomination</h3>
                    
                    {!variationsLoaded ? (
                         // OPTIMIZED: Specific Skeleton for variations while they load
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {[1,2,3,4].map(i => (
                                 <div key={i} className="h-20 bg-dark-950 border border-white/5 rounded-xl animate-pulse"></div>
                             ))}
                         </div>
                    ) : (
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
                    )}
                </div>
             ) : (
                 <div className="bg-dark-900 border border-white/5 rounded-2xl p-6 shadow-xl flex items-center gap-6">
                      <div className="w-16 h-16 bg-primary/20 text-primary rounded-xl flex items-center justify-center text-3xl"><i className="fas fa-check-circle"></i></div>
                      <div><h3 className="text-white font-bold text-lg uppercase">{editionName}</h3></div>
                      <div className="ml-auto text-right">
                          <div className="text-sm text-gray-500 line-through">৳{product.regular_price}</div>
                          <div className="text-3xl font-black text-white">৳{product.price}</div>
                      </div>
                 </div>
             )}

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

          <div className="lg:col-span-4">
             <div className="sticky top-24 space-y-6">
                <div className="bg-dark-900 border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-600"></div>
                    <div className="bg-dark-950 rounded-xl p-4 border border-white/5 mb-6">
                        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
                            <span className="text-gray-400 text-xs font-bold uppercase">Item</span>
                            <span className="text-white text-xs font-bold text-right truncate max-w-[150px]">
                                {isVariable && selectedVariation ? selectedVariation.name : product.name}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-xs font-bold uppercase">Quantity</span>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setQty(Math.max(1, qty-1))} className="w-8 h-8 rounded bg-dark-800 hover:bg-white/10 text-white flex items-center justify-center transition-colors">-</button>
                                <span className="w-8 text-center font-black text-white">{qty}</span>
                                <button onClick={() => setQty(qty+1)} className="w-8 h-8 rounded bg-dark-800 hover:bg-white/10 text-white flex items-center justify-center transition-colors">+</button>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
                        <span className="text-gray-400 text-sm font-bold uppercase">Total Price</span>
                        <div className="text-right">
                             {parseFloat(regularPrice) > parseFloat(displayPrice) && (
                                 <div className="text-xs text-gray-500 line-through mb-1">৳{(parseFloat(regularPrice) * qty).toFixed(0)}</div>
                             )}
                             
                             {/* PRICE LOADING STATE */}
                             {!isVariable || variationsLoaded ? (
                                <div className="text-4xl font-black text-primary tracking-tight">৳{totalPrice}</div>
                             ) : (
                                <div className="h-10 w-32 bg-dark-950 animate-pulse rounded"></div>
                             )}
                             
                             <div className="text-[10px] text-gray-500 font-mono mt-1">Credits Earned: {(parseFloat(totalPrice) * 0.01).toFixed(0)}</div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <button 
                            onClick={() => { 
                                if (isVariable && !selectedVariation) {
                                    showToast("Please select a package first", "error");
                                    return;
                                }
                                addToCart(product, qty, selectedVariation || undefined); 
                                navigate('/cart'); 
                            }} 
                            disabled={isVariable && !variationsLoaded}
                            className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase italic tracking-wider py-4 rounded-xl shadow-glow transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isVariable && !variationsLoaded ? 'Loading...' : 'Buy Now'}
                        </button>
                        <button 
                            onClick={() => {
                                if (isVariable && !selectedVariation) {
                                    showToast("Please select a package first", "error");
                                    return;
                                }
                                addToCart(product, qty, selectedVariation || undefined);
                            }} 
                            disabled={isVariable && !variationsLoaded}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <i className="fas fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>

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

                <div className="bg-dark-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl min-h-[100px]">
                    <div className="bg-dark-950 p-4 border-b border-white/5 flex justify-between items-center">
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider">Related Cards</h4>
                        {product.categories[0] && (
                            <Link to={`/category/${product.categories[0].slug}`} className="text-[10px] text-primary font-bold uppercase hover:underline">View All</Link>
                        )}
                    </div>
                    
                    {loadingRelated ? (
                        <div className="p-4 space-y-4">{[1,2,3].map(i => <div key={i} className="h-12 bg-white/5 rounded animate-pulse"></div>)}</div>
                    ) : relatedProducts.length > 0 ? (
                        <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                            {relatedProducts.map(p => (
                                <Link to={`/product/${p.slug}`} key={p.id} className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group">
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
                                    <div className="text-right"><span className="block text-primary text-xs font-bold">৳{p.price}</span></div>
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

        <div className="mt-24 border-t border-white/5 pt-12">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-wide mb-8">You Might Also Like</h2>
            {loadingRelated ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
            ) : suggestedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{suggestedProducts.map(p => (<ProductCard key={p.id} product={p} />))}</div>
            ) : (
                <p className="text-gray-500">No suggestions available.</p>
            )}
        </div>
      </div>
      
      {/* MOBILE FLOATING CTA (Replaces old sticky footer, hidden on Desktop, respects Bottom Nav) */}
      <div className="fixed bottom-16 left-0 w-full bg-dark-900 border-t border-white/10 p-4 z-40 md:hidden flex items-center justify-between gap-4 shadow-2xl safe-area-bottom">
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Total</p>
            {isVariable && !variationsLoaded ? (
                <div className="h-6 w-16 bg-white/10 animate-pulse rounded"></div>
            ) : (
                <p className="text-xl font-black text-white">৳{totalPrice}</p>
            )}
          </div>
          <button 
              onClick={() => { 
                if (isVariable && !selectedVariation) {
                    showToast("Please select a package first", "error");
                    return;
                }
                addToCart(product, qty, selectedVariation || undefined); 
                navigate('/cart'); 
              }} 
              disabled={isVariable && !variationsLoaded}
              className="bg-primary text-black font-black uppercase italic py-3 px-8 rounded shadow-glow flex-1 disabled:opacity-50"
          >
              {isVariable && !variationsLoaded ? 'Loading...' : 'Buy Now'}
          </button>
      </div>
    </div>
  );
};
