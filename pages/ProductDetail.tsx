
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
    GBP: { label: "GBP", flag: "🇬🇧", fallback: 0.79 }, // Great Britain
    EUR: { label: "EUR", flag: "🇪🇺", fallback: 0.93 },  // Euro
    UAH: { label: "UAH", flag: "🇺🇦", fallback: 41.60 }, // Ukraine
    INR: { label: "INR", flag: "🇮🇳", fallback: 84.10 }, // India
    TRY: { label: "TRY", flag: "🇹🇷", fallback: 34.25 }, // Turkey
    ARS: { label: "ARS", flag: "🇦🇷", fallback: 980.50 }, // Argentina
    BRL: { label: "BRL", flag: "🇧🇷", fallback: 5.75 },  // Brazil
    PLN: { label: "PLN", flag: "🇵🇱", fallback: 3.96 },  // Poland
};

// SECURE GIFT CARD CALCULATOR USING BACKEND API
const GiftCardCalculator: React.FC<{ variations: Variation[], product: Product }> = ({ variations, product }) => {
    const [target, setTarget] = useState<string>('');
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [result, setResult] = useState<any | null>(null);
    const [loadingCalc, setLoadingCalc] = useState(false);
    const [error, setError] = useState('');
    const { addToCart } = useCart();
    const { showToast } = useToast();

    const handleCalculate = async () => {
        const rawVal = parseFloat(target);
        
        // Strict Validation to avoid 400 Bad Request
        if (isNaN(rawVal) || rawVal <= 0) {
            setError("Please enter a valid amount.");
            setResult(null);
            return;
        }
        setError('');
        setLoadingCalc(true);

        try {
            // SECURE CALL TO BACKEND
            const data = await api.calculateBundle(product.id, rawVal, selectedCurrency);
            
            setResult({
                items: data.items, // Backend returns array of items with variationId, quantity, subtotalBDT
                totalBDT: data.totalBDT,
                calculationToken: data.calculationToken,
                currency: data.currency,
                requestedAmount: data.requestedAmount,
                
                // New Conversion Fields from Backend
                requestedCurrency: data.requestedCurrency,
                convertedAmount: data.convertedAmount,
                actualAmount: data.actualAmount,
                matchType: data.matchType
            });
        } catch (e: any) {
            setError(e.message || "Calculation failed. Try a different amount.");
            setResult(null);
        } finally {
            setLoadingCalc(false);
        }
    };

    const handleAddBundle = () => {
        if(!result) return;
        
        // Add items to cart with Security Token
        result.items.forEach((item: any) => {
            // Find variation object to pass full data
            const variation = variations.find(v => v.id === item.variationId);
            
            // Safe conversion to avoid 'toString of undefined' error
            const priceOverride = (item.subtotalBDT !== undefined && item.subtotalBDT !== null) 
                ? String(item.subtotalBDT) 
                : "0";

            addToCart(
                product, 
                item.quantity, 
                variation, 
                priceOverride, // Custom Price from Backend
                {
                    token: result.calculationToken,
                    currency: result.currency, // Store BASE currency (e.g. USD)
                    timestamp: Date.now(),
                    originalDenom: item.denomination
                }
            );
        });
        showToast(`Bundle added to cart!`, 'success');
        setResult(null);
        setTarget('');
    };

    // HELPER: Calculate equivalent value in user's selected currency
    // This runs purely on frontend using CURRENCY_MAP fallback rates
    const getUserCurrencyEquivalent = () => {
        if (!result) return null;
        if (selectedCurrency === 'USD') return null; // No need to convert if already USD
        
        const rate = CURRENCY_MAP[selectedCurrency]?.fallback || 1;
        // result.actualAmount is usually in USD (e.g. 0.85)
        // 0.85 * 41.60 = ~35.36 UAH
        const approxValue = (result.actualAmount * rate).toFixed(2);
        
        return `${approxValue} ${selectedCurrency}`;
    };

    const userEquivalent = getUserCurrencyEquivalent();

    return (
        <div className="relative group mb-10">
            {/* GLOWING GRADIENT BORDER CONTAINER */}
            <div className="absolute -inset-[2px] bg-gradient-to-r from-primary via-purple-500 to-blue-600 rounded-2xl opacity-75 group-hover:opacity-100 blur-sm transition-opacity duration-1000 animate-pulse-slow"></div>
            
            <div className="relative bg-dark-950 rounded-2xl p-6 overflow-hidden">
                {/* Background Tech Mesh */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>

                {/* HEADER */}
                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dark-800 to-black border border-white/10 flex items-center justify-center shadow-lg">
                        <i className="fas fa-microchip text-2xl text-primary drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"></i>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                            Custom Loadout <span className="hidden sm:inline-block text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/30 not-italic">BETA</span>
                        </h3>
                        <p className="text-gray-400 text-xs font-medium">Buying a game for <span className="text-white font-bold">$18.49</span>? Don't overpay. Build exact amount.</p>
                    </div>
                </div>

                {/* INPUT DASHBOARD */}
                <div className="bg-dark-900/50 rounded-xl p-2 border border-white/5 flex flex-col sm:flex-row gap-2 relative z-10">
                    {/* Currency Select */}
                    <div className="relative min-w-[120px]">
                        <select 
                            value={selectedCurrency}
                            onChange={(e) => setSelectedCurrency(e.target.value)}
                            className="w-full h-14 bg-dark-950 border border-white/10 rounded-lg pl-4 pr-8 text-white font-bold text-sm focus:border-primary focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] outline-none appearance-none cursor-pointer transition-all"
                        >
                            {Object.entries(CURRENCY_MAP).map(([code, info]) => (
                                <option key={code} value={code}>{info.flag} {code}</option>
                            ))}
                        </select>
                        <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none"></i>
                    </div>

                    {/* Amount Input */}
                    <div className="relative flex-1">
                        <input 
                            type="number" 
                            step="0.01" 
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                            placeholder="Enter Amount (e.g. 10.50)"
                            className="w-full h-14 bg-dark-950 border border-white/10 rounded-lg px-4 text-white font-mono text-lg font-bold focus:border-primary focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] outline-none transition-all placeholder:text-gray-600"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold uppercase tracking-widest pointer-events-none">
                            VAL
                        </div>
                    </div>

                    {/* Action Button */}
                    <button 
                        onClick={handleCalculate}
                        disabled={loadingCalc}
                        className="h-14 sm:w-40 bg-white text-black font-black uppercase tracking-wider rounded-lg hover:bg-primary hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                    >
                        {loadingCalc ? <i className="fas fa-circle-notch fa-spin"></i> : <><i className="fas fa-bolt"></i> Build</>}
                    </button>
                </div>
                
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 ml-1 text-red-400 text-xs font-bold flex items-center gap-2">
                        <i className="fas fa-exclamation-circle"></i> {error}
                    </motion.div>
                )}

                {/* RESULTS - LOOT CRATE STYLE */}
                <AnimatePresence mode='wait'>
                    {result && (
                        <motion.div 
                            key="result-box"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", bounce: 0.4 }}
                            className="mt-6 bg-gradient-to-b from-dark-900 to-black rounded-xl border border-primary/20 overflow-hidden relative shadow-2xl"
                        >
                             {/* Decorative Top Line */}
                             <div className="h-1 w-full bg-gradient-to-r from-primary via-purple-500 to-primary"></div>

                             {/* Header Info */}
                             <div className="p-4 border-b border-white/5 flex flex-wrap justify-between items-center gap-3 bg-white/5 backdrop-blur-sm">
                                 <div className="flex items-center gap-2">
                                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                     <span className="text-green-500 font-bold uppercase text-[10px] tracking-widest">System Optimized</span>
                                 </div>
                                 <div className="px-3 py-1 rounded-full bg-dark-950 border border-white/10 text-xs font-mono text-gray-300 flex items-center gap-2">
                                     {/* Show requested vs actual */}
                                     <span>Req: <span className="text-white">{result.requestedAmount} {selectedCurrency}</span></span>
                                     <i className="fas fa-arrow-right text-[10px] text-gray-600"></i>
                                     <span className="text-primary font-bold">Get: {result.actualAmount} {result.currency}</span>
                                 </div>
                             </div>

                             <div className="p-6">
                                 {/* Warning / Info Box */}
                                 {result.matchType === 'closest' && (
                                     <div className="mb-6 bg-yellow-500/5 border-l-2 border-yellow-500 pl-4 py-2">
                                         <h4 className="text-yellow-500 font-bold text-xs uppercase mb-1">Closest Match Found</h4>
                                         <p className="text-gray-400 text-[11px]">
                                             We couldn't make exactly {result.requestedAmount} {selectedCurrency}. 
                                             This bundle gives you <strong className="text-white">{result.actualAmount} {result.currency}</strong>
                                             {userEquivalent && (
                                                 <span className="text-yellow-500 ml-1">
                                                     (approx. ≈ {userEquivalent})
                                                 </span>
                                             )}.
                                         </p>
                                     </div>
                                 )}

                                 {/* LOOT ITEMS GRID */}
                                 <div className="mb-8">
                                     <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 pl-1">Inventory Generated:</p>
                                     <div className="flex flex-wrap gap-3">
                                         {result.items.map((item: any, idx: number) => (
                                             <motion.div 
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="relative group w-28 aspect-[3/4] bg-dark-800 rounded-lg border border-white/10 hover:border-primary/50 transition-all overflow-hidden shadow-lg flex flex-col items-center justify-center p-2"
                                             >
                                                 {/* Quantity Badge */}
                                                 <div className="absolute top-2 right-2 bg-white/10 text-white text-[10px] font-black px-1.5 py-0.5 rounded backdrop-blur-md border border-white/10 z-10">
                                                     x{item.quantity}
                                                 </div>
                                                 
                                                 {/* Icon */}
                                                 <div className="w-10 h-10 mb-2 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                                                     <i className="fas fa-gift"></i>
                                                 </div>
                                                 
                                                 {/* Value */}
                                                 <div className="text-center">
                                                     <div className="text-xl font-black text-white leading-none">{item.denomination}</div>
                                                     <div className="text-[9px] font-bold text-gray-500 uppercase mt-1">{result.currency}</div>
                                                 </div>
                                                 
                                                 {/* Shine Effect */}
                                                 <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                             </motion.div>
                                         ))}
                                     </div>
                                 </div>

                                 {/* FOOTER ACTION */}
                                 <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 pt-6 border-t border-white/5">
                                     <div>
                                         <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Total Bundle Price</p>
                                         <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">৳{result.totalBDT}</span>
                                            <span className="text-[10px] text-green-400 font-bold bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20 uppercase">Instant</span>
                                         </div>
                                     </div>
                                     <button 
                                         onClick={handleAddBundle}
                                         className="w-full sm:w-auto px-8 h-14 bg-gradient-to-r from-primary to-blue-600 hover:from-white hover:to-white hover:text-black text-white font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all transform active:scale-95 flex items-center justify-center gap-3 text-sm"
                                     >
                                         <span>Add To Cart</span>
                                         <i className="fas fa-arrow-right"></i>
                                     </button>
                                 </div>
                             </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
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

  // Interaction State
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'redeem' | 'specs'>('desc');
  const [isProcessingGiftCard, setIsProcessingGiftCard] = useState(false); // New Loading State
  
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
      
      if (data) {
          setProduct(data);
          if (data.variations && data.variations.length > 0) {
              setSelectedVariation(data.variations[0]);
          }
      }
      
      setLoadingMain(false);

      if (data) {
            try {
                // Related Cards Logic
                let related: Product[] = [];
                if (data.cross_sell_ids && data.cross_sell_ids.length > 0) {
                     related = await api.getProductsByIds(data.cross_sell_ids);
                } else if (data.categories.length > 0) {
                     const categorySlug = data.categories[0].slug;
                     const allInCat = await api.getProducts(categorySlug); 
                     related = allInCat.filter(p => p.id !== data.id).slice(0, 8);
                }
                setRelatedProducts(related);

                // Suggested Products Logic
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
  const variationsLoaded = product.variations && product.variations.length > 0;
  
  // SECURE GIFT CARD CHECK
  const isGiftCardProduct = product.id === config.pricing.giftCardProductId;

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

  // SECURE BUY HANDLER FOR GIFT CARDS
  const handleSecureBuy = async (redirect: boolean) => {
      if (isVariable && !selectedVariation) {
          showToast("Please select a package first", "error");
          return;
      }
      
      // If NOT gift card, standard flow
      if (!isGiftCardProduct) {
          addToCart(product, qty, selectedVariation || undefined);
          if (redirect) navigate('/cart');
          return;
      }

      // GIFT CARD FLOW
      if (!selectedVariation) return;
      setIsProcessingGiftCard(true);
      
      try {
          // 1. Get Denomination (Try parsing from name, fallback to attribute)
          let denom = 0;
          const match = selectedVariation.name.match(/(\d+(\.\d+)?)/);
          if (match) denom = parseFloat(match[0]);
          
          if (denom === 0) throw new Error("Could not determine card value");

          // 2. Calculate Token for this specific variation & quantity
          // NOTE: Backend logic says "User adds 2x $10 -> Token generated for quantity: 2".
          // So we must calculate based on total amount (Denom * Qty).
          const totalAmount = denom * qty;
          
          const data = await api.calculateBundle(product.id, totalAmount, 'USD'); // Assuming USD for standard vars
          
          // 3. Add to cart with token
          // Since the backend calculator returns a breakdown, we add THOSE items.
          // Usually for "2x $10", it should return items: [{ name: "Steam $10", quantity: 2 }]
          
          data.items.forEach((item: any) => {
               // We need to match the variation from our local list to the one returned
               // Or just use the selectedVariation if IDs match
               const matchedVar = product.variations?.find(v => v.id === item.variationId) || selectedVariation;
               
               // Robust Handling: ensure price is string
               const priceOverride = (item.subtotalBDT !== undefined && item.subtotalBDT !== null) 
                   ? String(item.subtotalBDT) 
                   : "0";

               addToCart(
                   product,
                   item.quantity,
                   matchedVar,
                   priceOverride,
                   {
                       token: data.calculationToken,
                       currency: data.currency,
                       timestamp: Date.now(),
                       originalDenom: item.denomination
                   }
               );
          });
          
          if (redirect) navigate('/cart');
          else showToast("Added to cart securely", "success");

      } catch (err: any) {
          showToast(`Security check failed: ${err.message}`, "error");
      } finally {
          setIsProcessingGiftCard(false);
      }
  };

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
             {/* SECURE GIFT CARD CALCULATOR - Only for Gift Card Product */}
             {isGiftCardProduct && product.variations && (
                 <GiftCardCalculator variations={product.variations} product={product} />
             )}
             
             {isVariable ? (
                <div className="bg-dark-900 border border-white/5 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Select Denomination</h3>
                    
                    {!variationsLoaded ? (
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
                                        {/* Standard price, but note that for gift cards we recalculate securely on click */}
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
                             {/* PRICE LOADING STATE */}
                             {!isVariable || variationsLoaded ? (
                                <div className="text-4xl font-black text-primary tracking-tight">৳{totalPrice}</div>
                             ) : (
                                <div className="h-10 w-32 bg-dark-950 animate-pulse rounded"></div>
                             )}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <button 
                            onClick={() => handleSecureBuy(true)} 
                            disabled={(isVariable && !variationsLoaded) || isProcessingGiftCard}
                            className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase italic tracking-wider py-4 rounded-xl shadow-glow transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessingGiftCard ? 'Verifying Price...' : 'Buy Now'}
                        </button>
                        <button 
                            onClick={() => handleSecureBuy(false)} 
                            disabled={(isVariable && !variationsLoaded) || isProcessingGiftCard}
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
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};