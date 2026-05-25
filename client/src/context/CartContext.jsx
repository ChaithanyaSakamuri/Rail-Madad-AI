import { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';

export const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('deepya_cart') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('deepya_cart', JSON.stringify(items));
  }, [items]);

  // Unique key per product + size + color combination
  const itemKey = (p) => `${p._id}-${p.selectedSize || ''}-${p.selectedColor || ''}`;

  const addItem = useCallback((product, qty = 1) => {
    setItems(prev => {
      const key = itemKey(product);
      const idx = prev.findIndex(i => itemKey(i) === key);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: Math.min(updated[idx].quantity + qty, product.stock || 99) };
        return updated;
      }
      return [...prev, { ...product, quantity: Math.min(qty, product.stock || 99) }];
    });
  }, []);

  const removeItem = useCallback((key) => {
    setItems(prev => prev.filter(i => itemKey(i) !== key && i._id !== key));
  }, []);

  const updateQty = useCallback((key, qty) => {
    setItems(prev => prev.map(i => (itemKey(i) === key || i._id === key) ? { ...i, quantity: Math.max(1, qty) } : i));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  const discount = useMemo(() => items.reduce((s, i) => s + (i.price * ((i.discount || 0) / 100)) * i.quantity, 0), [items]);
  const total = useMemo(() => subtotal - discount, [subtotal, discount]);
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ 
      items, 
      addItem, 
      removeItem, 
      updateQty, 
      clearCart, 
      subtotal, 
      discount, 
      total, 
      count, 
      itemKey,
      // Compatibility mappings for CartDrawer and PurchaseModal
      cartItems: items,
      updateQuantity: (key, qty) => updateQty(key, qty),
      removeFromCart: (key) => removeItem(key),
      cartCount: count,
      cartTotal: subtotal,
      cartDiscountTotal: discount,
      cartFinalTotal: total
    }}>
      {children}
    </CartContext.Provider>
  );
};
