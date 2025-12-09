
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Variation } from '../types';
import { useToast } from './ToastContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, variation?: Variation) => void;
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

  const addToCart = (product: Product, quantity = 1, variation?: Variation) => {
    setItems(prev => {
      const idx = prev.findIndex(item => item.id === product.id && item.selectedVariation?.id === variation?.id);
      if (idx > -1) {
        const newItems = [...prev];
        newItems[idx].quantity += quantity;
        return newItems;
      }
      return [...prev, { ...product, quantity, selectedVariation: variation }];
    });
    showToast(`Added ${product.name} to cart`);
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(item => `${item.id}-${item.selectedVariation?.id || 'default'}` !== id));
    showToast('Removed from cart', 'info');
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setItems(prev => prev.map(item => `${item.id}-${item.selectedVariation?.id || 'default'}` === id ? { ...item, quantity: qty } : item));
  };

  const clearCart = () => { setItems([]); localStorage.removeItem('cart_items'); };
  
  const cartTotal = items.reduce((total, item) => {
    const price = item.selectedVariation ? parseFloat(item.selectedVariation.price) : (item.on_sale && item.sale_price ? parseFloat(item.sale_price) : parseFloat(item.price));
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
