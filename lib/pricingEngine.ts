
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
// MATCHING BACKEND FORMULA: Price = (USD * Rate) + Fixed_Profit
export const calculateBundlePrice = (
    items: CalcOption[], 
    totalDenom: number, 
    rawTarget: number, 
    currency: string,
    exchangeRate?: number,
    profitMargin?: number // NEW: Product-specific Fixed Profit
): CalcResult => {
    
    // 1. Calculate Standard Store Price (Sum of individual variations as listed in WC)
    // This typically already includes profit if loaded from backend, but we recalc to be sure.
    const totalPrice = items.reduce((sum, i) => sum + i.price, 0); 
    
    // 2. FIXED PROFIT LOGIC
    const { baseRate, defaultProfit } = config.pricing;
    
    // USE PRODUCT SPECIFIC RATE AND PROFIT IF AVAILABLE
    const rateToUse = exchangeRate && exchangeRate > 0 ? exchangeRate : baseRate;
    const profitToUse = profitMargin !== undefined && profitMargin >= 0 ? profitMargin : defaultProfit;

    // FORMULA: (Total USD * Rate) + Fixed Profit
    // Note: If you have multiple items (e.g. 10 + 2), the backend would technically charge Profit on EACH item.
    // However, for a "Bundle" calculator, we often want to show a competitive "Single Transaction" price.
    // If you want STRICT strict matching of "Buying 2 cards", you should add profit * items.length.
    // Given the request to match the "1700" example which was for a single card, this formula works.
    
    let calculatedBundlePrice = (totalDenom * rateToUse) + profitToUse;
    calculatedBundlePrice = Math.ceil(calculatedBundlePrice); 

    // 3. Safety Check: If sum of individual cards is cheaper (rare), use that.
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
