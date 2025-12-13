
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
            setError("Enter a valid amount.");
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
                requestedAmount: data.requestedAmount
            });
        } catch (e: any) {
            setError(e.message || "Calculation failed");
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
                    currency: result.currency,
                    timestamp: Date.now(),
                    originalDenom: item.denomination
                }
            );
        });
        showToast(`Added items to cart securely!`, 'success');
        setResult(null);
        setTarget('');
    };

    return (
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <i className="fas fa-calculator text-6xl text-white"></i>
            </div>
            
            <h3 className="text-xl font-black text-white uppercase italic mb-2 flex items-center gap-2">
                <i className="fas fa-magic text-yellow-400"></i> Smart Calculator
            </h3>
            <p className="text-gray-300 text-sm mb-6 max-w-lg">
                Enter amount in <span className="text-white font-bold">ANY Currency</span>. Our secure system will calculate the best bundle.
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
                    disabled={loadingCalc}
                    className="bg-primary hover:bg-primary-hover text-black font-black uppercase px-6 py-3 rounded-xl shadow-glow transition-transform active:scale-95 w-full sm:w-auto disabled:opacity-50"
                >
                    {loadingCalc ? 'Calculating...' : 'Calculate'}
                </button>
            </div>

            {error && <p className="text-red-400 text-sm font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20"><i className="fas fa-exclamation-circle"></i> {error}</p>}

            {result && (
                <div className="bg-dark-950/80 border border-white/10 rounded-xl p-5 animate-fade-in-up shadow-2xl">
                     <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                         <div>
                             <p className="text-gray-400 text-xs uppercase font-bold">We will send you:</p>
                             
                             <div className="flex flex-col gap-2 mt-2">
                                 {result.items.map((item: any, idx: number) => (
                                     <span key={idx} className="text-white font-mono font-bold text-sm flex items-center gap-2">
                                         <span className="bg-white/10 px-2 py-0.5 rounded text-xs">x{item.quantity}</span>
                                         {item.name}
                                     </span>
                                 ))}
                             </div>
                             <p className="text-gray-500 text-[10px] mt-2 italic"><i className="fas fa-shield-alt text-green-500"></i> Secure Price Verified</p>
                         </div>
                         <div className="text-right">
                             <p className="text-gray-400 text-xs uppercase font-bold">Your Price</p>
                             <p className="text-2xl font-black text-primary">৳{result.totalBDT}</p>
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