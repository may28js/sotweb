import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, ShopItem, User } from '../types';

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addToCart: (item: ShopItem) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children, user }: { children: React.ReactNode; user: User | null }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage when user changes
  useEffect(() => {
    setIsLoaded(false);
    if (user) {
      const key = `launcher_cart_${user.id}`;
      const savedCart = localStorage.getItem(key);
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error('Failed to parse cart', e);
          setCart([]);
        }
      } else {
        setCart([]);
      }
    } else {
      setCart([]);
    }
    setIsLoaded(true);
  }, [user?.id]);

  // Save cart to localStorage
  useEffect(() => {
    if (isLoaded && user) {
      const key = `launcher_cart_${user.id}`;
      localStorage.setItem(key, JSON.stringify(cart));
    }
  }, [cart, isLoaded, user?.id]);

  const addToCart = (item: ShopItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (item.isUnique) return prev;
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  // Re-implementing removeFromCart more carefully to match App.tsx logic
  const removeFromCartWithLogic = (id: number) => {
      setCart(prev => {
          const newCart = prev.filter(i => i.id !== id);
          if (newCart.length === 0) setIsCartOpen(false);
          return newCart;
      });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }));
  };

  const clearCart = () => {
    setCart([]);
    setIsCartOpen(false);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      removeFromCart: removeFromCartWithLogic,
      updateQuantity,
      clearCart,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
