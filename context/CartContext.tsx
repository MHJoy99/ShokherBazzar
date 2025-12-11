
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Variation } from '../types';
import { useToast } from './ToastContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, variation?: Variation, customPrice?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
}
const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const { showToast } = useToast();

  useEffect(() => { localStorage.setItem('cart_items', JSON.stringify(items)); }, [items]);

  const addToCart = (product: Product, quantity = 1, variation?: Variation, customPrice?: string) => {
    setItems(prev => {
      // Create a unique ID that includes custom price to separate bundled items from normal ones
      const itemKey = `${product.id}-${variation?.id || 'default'}-${customPrice || 'std'}`;
      
      const idx = prev.findIndex(item => {
          const currentKey = `${item.id}-${item.selectedVariation?.id || 'default'}-${item.custom_price || 'std'}`;
          return currentKey === itemKey;
      });

      if (idx > -1) {
        const newItems = [...prev];
        newItems[idx].quantity += quantity;
        return newItems;
      }
      return [...prev, { ...product, quantity, selectedVariation: variation, custom_price: customPrice }];
    });
    
    // Toast message logic
    const priceMsg = customPrice ? ` (Bundle Price: ৳${parseFloat(customPrice).toFixed(0)})` : '';
    showToast(`Added ${product.name}${priceMsg} to cart`);
  };

  const removeFromCart = (id: string) => {
    // ID generation needs to match addToCart logic or be passed explicitly
    // Here we filter by reconstructing key or assuming 'id' passed is the compound key?
    // To be safe, we'll assume the UI passes the exact unique key logic, 
    // BUT current UI passes `${item.id}-${item.selectedVariation?.id || 'default'}`
    // We need to update that to include custom_price
    setItems(prev => prev.filter(item => {
        const currentKey = `${item.id}-${item.selectedVariation?.id || 'default'}-${item.custom_price || 'std'}`;
        return currentKey !== id;
    }));
    showToast('Removed from cart', 'info');
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setItems(prev => prev.map(item => {
        const currentKey = `${item.id}-${item.selectedVariation?.id || 'default'}-${item.custom_price || 'std'}`;
        return currentKey === id ? { ...item, quantity: qty } : item;
    }));
  };

  const clearCart = () => { setItems([]); localStorage.removeItem('cart_items'); };
  
  const cartTotal = items.reduce((total, item) => {
    let price = 0;
    if (item.custom_price) {
        price = parseFloat(item.custom_price);
    } else {
        price = item.selectedVariation ? parseFloat(item.selectedVariation.price) : (item.on_sale && item.sale_price ? parseFloat(item.sale_price) : parseFloat(item.price));
    }
    return total + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount: items.reduce((c, i) => c + i.quantity, 0) }}>
      {children}
    </CartContext.Provider>
  );
};
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart error');
  return context;
};
