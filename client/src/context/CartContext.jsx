import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'tcs_cart_v1';

function loadCart() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((i) => i && i.productId && i.name)
      .map((i) => ({
        productId: i.productId,
        slug: i.slug || '',
        name: i.name,
        image: i.image || '',
        unitPrice: Number(i.unitPrice) || 0,
        quantity: Math.max(1, Math.min(999, parseInt(i.quantity, 10) || 1)),
        variations: i.variations && typeof i.variations === 'object' ? i.variations : {},
        variationsText: i.variationsText || '',
      }));
  } catch (_err) {
    return [];
  }
}

function variationsTextOf(variations) {
  const parts = Object.entries(variations || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}: ${v}`);
  return parts.join(', ');
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (_err) {
      // storage full/privacy mode — cart keeps working in memory only
    }
  }, [items]);

  const addItem = useCallback(
    (product, { quantity = 1, variations = {} } = {}) => {
      const qty = Math.max(1, Math.min(999, parseInt(quantity, 10) || 1));
      const unitPrice = product.salePrice != null ? product.salePrice : product.price;
      const text = variationsTextOf(variations);

      setItems((prev) => {
        const existing = prev.find(
          (i) => i.productId === product.id && i.variationsText === text
        );
        const item = {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.primaryImage || product.image || '',
          unitPrice,
          variations,
          variationsText: text,
        };
        if (existing) {
          return prev.map((i) =>
            i === existing
              ? { ...i, quantity: Math.min(999, i.quantity + qty) }
              : i
          );
        }
        return [...prev, { ...item, quantity: qty }];
      });
      return qty;
    },
    []
  );

  const removeItem = useCallback((productId, variationsText = '') => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variationsText === variationsText))
    );
  }, []);

  const updateQuantity = useCallback((productId, variationsText, quantity) => {
    const qty = Math.max(1, Math.min(999, parseInt(quantity, 10) || 1));
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.variationsText === variationsText
          ? { ...i, quantity: qty }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }),
    [items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}