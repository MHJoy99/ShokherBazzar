
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
// We simply send these codes to the backend. The backend handles the math.
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

const GiftCardCalculator: React.FC<{ variations: Variation[], product: Product }> = ({ variations, product }) => {
    const [target, setTarget] = useState<string>('');
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [calcInfo, setCalcInfo] = useState<CalculatorInfo | null>(null);

    // Result State now matches CalculatorResult interface
    const [result, setResult] = useState<CalculatorResult | null>(null);
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState('');
    const { addToCart } = useCart();
    const { showToast } = useToast();

    // Fetch official display rate (Optional, for UI "1 USD ≈ 129 BDT" hint only)
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

        // --- NEW LOGIC: DIRECT TO BACKEND ---
        // We send the raw amount and the currency code.
        // The backend handles conversion and returns the exact math.
        
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
        
        // Loop through the items returned by the BACKEND
        result.items.forEach((item: any) => {
            const variation = variations.find(v => v.id === item.variation_id);
            
            if (variation) {
                // SECURITY: Capture the token from response
                const bundleInfo = result.calculation_token ? {
                    token: result.calculation_token,
                    productId: product.id,
                    amount: result.requested_amount,
                    currency: result.currency // Capture currency for validation
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
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <i className="fas fa-calculator text-6xl text-white"></i>
            </div>
            
            <h3 className="text-xl font-black text-white uppercase italic mb-2 flex items-center gap-2">
                <i className="fas fa-magic text-yellow-400"></i> Smart Calculator
            </h3>
            <p className="text-gray-300 text-sm mb-6 max-w-lg">
                Enter amount in <span className="text-white font-bold">ANY Currency</span>. We'll find the best official card combination.
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
                            onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                        />
                    </div>
                </div>
                <button 
                    onClick={handleCalculate}
                    disabled={calculating}
                    className="bg-primary hover:bg-primary-hover text-black font-black uppercase px-6 py-3 rounded-xl shadow-glow transition-transform active:scale-95 w-full sm:w-auto disabled:opacity-50"
                >
                    {calculating ? 'Checking...' : 'Calculate'}
                </button>
            </div>
            
            {/* Optional Rate Hint (Fetched from backend info) */}
            {selectedCurrency === 'BDT' && calcInfo && calcInfo.exchange_rate > 0 && (
                <p className="text-[10px] text-gray-400 font-mono mb-4 ml-1">
                    <i className="fas fa-info-circle mr-1"></i>
                    Official Rate: 1 USD ≈ {calcInfo.exchange_rate} BDT
                </p>
            )}

            {error && <p className="text-red-400 text-sm font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20"><i className="fas fa-exclamation-circle"></i> {error}</p>}

            {result && (
                <div className="bg-dark-950/80 border border-white/10 rounded-xl p-5 animate-fade-in-up shadow-2xl space-y-4">
                     
                     {/* 1. Header showing user request */}
                     <div className="flex justify-between items-start border-b border-white/5 pb-2">
                         <div>
                             <p className="text-gray-400 text-xs uppercase font-bold">You Requested</p>
                             <p className="text-white font-bold">{result.requested_amount} {selectedCurrency}</p>
                         </div>
                         <div className="text-right">
                             {result.match_type === 'closest' ? (
                                 <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-2 py-1 rounded border border-yellow-500/20">
                                     Closest Match
                                 </span>
                             ) : (
                                 <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded border border-green-500/20">
                                     Exact Match
                                 </span>
                             )}
                         </div>
                     </div>

                     {/* 2. Backend Conversion Display */}
                     {result.conversion && (
                        <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded text-[11px] text-blue-300 flex items-center justify-between">
                            <span>
                                <i className="fas fa-exchange-alt mr-2"></i>
                                {result.conversion.original_amount} {result.conversion.original_currency}
                            </span>
                            <span className="font-bold text-white">
                                = ${result.conversion.converted_amount} {result.conversion.converted_currency}
                            </span>
                        </div>
                     )}

                     {/* 3. Detailed Item Breakdown */}
                     <div className="bg-white/5 rounded-lg p-3 space-y-2">
                        <p className="text-gray-400 text-[10px] uppercase font-bold mb-1">Your Bundle Includes:</p>
                        {result.items && result.items.map((item: any, idx: number) => (
                             <div key={idx} className="flex justify-between items-center text-sm">
                                 <div className="flex items-center gap-2">
                                     <span className="bg-primary text-black font-bold text-xs w-5 h-5 flex items-center justify-center rounded-full">{item.quantity}x</span>
                                     <span className="text-white font-bold">{item.name}</span>
                                 </div>
                                 <div className="text-right">
                                    <span className="text-gray-400 text-xs block">@{item.unit_price_bdt} BDT</span>
                                    <span className="text-white font-bold">{item.subtotal_bdt} BDT</span>
                                 </div>
                             </div>
                        ))}
                     </div>
                     
                     {/* 4. Totals */}
                     <div className="flex justify-between items-end pt-2">
                         <div>
                            <p className="text-gray-400 text-xs uppercase font-bold">Total Denom</p>
                            <p className="text-white font-bold text-lg">${result.actual_amount} USD</p>
                         </div>
                         <div className="text-right">
                             <p className="text-gray-400 text-xs uppercase font-bold">Total Price</p>
                             <p className="text-3xl font-black text-primary">৳{result.total_bdt}</p>
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
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedVarId, setSelectedVarId] = useState<number | null>(null);
    const { addToCart } = useCart();
    const location = useLocation();

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            if (location.state?.preload && location.state.preload.slug === slug) {
                 setProduct(location.state.preload);
            }
            if (slug) {
                const p = await api.getProduct(slug);
                if (p) setProduct(p);
            }
            setLoading(false);
        };
        fetchProduct();
    }, [slug, location.state]);

    if (loading && !product) {
        return (
            <div className="min-h-screen pt-32 pb-20 px-4 max-w-7xl mx-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="aspect-[3/4] bg-white/5 rounded-2xl animate-pulse"></div>
                     <div className="space-y-6">
                         <div className="h-10 bg-white/5 rounded w-3/4 animate-pulse"></div>
                         <div className="h-4 bg-white/5 rounded w-full animate-pulse"></div>
                         <div className="h-4 bg-white/5 rounded w-2/3 animate-pulse"></div>
                     </div>
                 </div>
            </div>
        );
    }

    if (!product) return <div className="min-h-screen flex items-center justify-center text-white">Product not found</div>;

    const isVariable = product.type === 'variable' && product.variations && product.variations.length > 0;
    const currentPrice = selectedVarId 
        ? product.variations?.find(v => v.id === selectedVarId)?.price 
        : product.price;

    const showCalculator = isVariable && product.variations!.some(v => /\d+/.test(v.name));

    return (
        <div className="min-h-screen bg-transparent pb-20 pt-32">
            <Helmet>
                <title>{product.name} | {config.siteName}</title>
                <meta name="description" content={product.short_description} />
            </Helmet>

            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* LEFT COLUMN: IMAGES */}
                    <div className="lg:col-span-5">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-dark-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl sticky top-24"
                        >
                            <img src={product.images[0].src} className="w-full h-auto object-cover" alt={product.name} />
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN: DETAILS */}
                    <div className="lg:col-span-7">
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="flex items-center gap-3 mb-4">
                                {product.platform && (
                                    <span className="bg-white/5 border border-white/10 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-2">
                                        <i className="fas fa-gamepad"></i> {product.platform}
                                    </span>
                                )}
                                {product.stock_status === 'instock' ? (
                                    <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-green-500/20">
                                        In Stock
                                    </span>
                                ) : (
                                    <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-red-500/20">
                                        Out of Stock
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic leading-tight mb-4">
                                {product.name}
                            </h1>

                            <div className="flex items-baseline gap-4 mb-8">
                                <span className="text-4xl font-black text-primary">৳{currentPrice}</span>
                                {product.regular_price && parseFloat(product.regular_price) > parseFloat(currentPrice) && (
                                    <span className="text-xl text-gray-500 line-through">৳{product.regular_price}</span>
                                )}
                            </div>
                            
                            {/* CALCULATOR WIDGET */}
                            {showCalculator && product.variations && (
                                <GiftCardCalculator variations={product.variations} product={product} />
                            )}

                            {/* VARIATION SELECTOR */}
                            {isVariable && (
                                <div className="mb-8">
                                    <p className="text-gray-400 text-xs font-bold uppercase mb-3">Select Package</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {product.variations!.map(v => (
                                            <button
                                                key={v.id}
                                                onClick={() => setSelectedVarId(v.id)}
                                                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${selectedVarId === v.id ? 'bg-primary border-primary text-black shadow-glow' : 'bg-dark-900 border-white/10 text-white hover:border-white/30'}`}
                                            >
                                                <span className="block text-xs font-bold uppercase mb-1 opacity-80">{v.name}</span>
                                                <span className="block font-black text-lg">৳{v.price}</span>
                                                {selectedVarId === v.id && <div className="absolute top-2 right-2 text-black"><i className="fas fa-check-circle"></i></div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ACTION BUTTONS */}
                            <div className="flex gap-4 mb-12">
                                <button 
                                    onClick={() => {
                                        if(isVariable && !selectedVarId) {
                                            alert("Please select a package option.");
                                            return;
                                        }
                                        const variation = isVariable ? product.variations?.find(v => v.id === selectedVarId) : undefined;
                                        addToCart(product, 1, variation);
                                    }}
                                    className="flex-1 bg-primary hover:bg-primary-hover text-black font-black uppercase py-4 rounded-xl shadow-glow transition-transform active:scale-95 text-lg"
                                >
                                    Add to Cart
                                </button>
                                <button className="w-16 bg-dark-900 border border-white/10 rounded-xl flex items-center justify-center text-white hover:text-red-500 transition-colors">
                                    <i className="fas fa-heart"></i>
                                </button>
                            </div>

                            {/* DESCRIPTION */}
                            <div className="bg-dark-900/50 p-8 rounded-2xl border border-white/5">
                                <h3 className="text-white font-bold uppercase mb-4 border-b border-white/5 pb-2">Description</h3>
                                <div 
                                    className="prose-custom text-gray-400 text-sm leading-relaxed" 
                                    dangerouslySetInnerHTML={{ __html: product.description }} 
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};
