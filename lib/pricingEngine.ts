
import { Variation } from '../types';
import { config } from '../config';

export interface CalcOption {
    denom: number;
    price: number;
    variation: Variation;
}

export interface CalcResult {
    type: 'single' | 'pair' | 'triple' | 'quad';
    items: CalcOption[];
    totalDenom: number;
    totalPrice: number;
    bundlePrice: number;
    savings: number;
    originalTarget: number;
    currency: string;
}

// THE "TWIN ENGINE" LOGIC
// Copy this logic logic to your WordPress PHP backend to enforce security.
export const calculateBundlePrice = (
    items: CalcOption[], 
    totalDenom: number, 
    rawTarget: number, 
    currency: string,
    dynamicRate?: number // NEW: Optional rate from WP API
): CalcResult => {
    
    // 1. Calculate Standard Store Price (Sum of cards)
    const totalPrice = items.reduce((sum, i) => sum + i.price, 0); 
    
    // 2. FIXED PROFIT MARGIN LOGIC
    // PRIORITIZE: Rate from Product API (set in WP Admin) > Config Default
    const { baseRate, profitTier1, profitTier2, profitTierThreshold } = config.pricing;
    const finalRate = dynamicRate && dynamicRate > 0 ? dynamicRate : baseRate;
    
    const flatProfit = totalDenom < profitTierThreshold ? profitTier1 : profitTier2;
    
    // New Bundle Price Calculation
    let calculatedBundlePrice = (totalDenom * finalRate) + flatProfit;
    calculatedBundlePrice = Math.ceil(calculatedBundlePrice); // Round up to nearest integer

    // 3. Safety Check: If Store Price is cheaper than our formula (rare), use Store Price.
    // This prevents user from paying MORE than buying individually.
    const finalPrice = Math.min(totalPrice, calculatedBundlePrice);
    
    const savings = Math.max(0, totalPrice - finalPrice);

    return {
        type: items.length === 1 ? 'single' : items.length === 2 ? 'pair' : items.length === 3 ? 'triple' : 'quad',
        items,
        totalDenom,
        totalPrice,
        bundlePrice: finalPrice,
        savings,
        originalTarget: rawTarget,
        currency: currency
    };
};
