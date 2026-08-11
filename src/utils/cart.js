import { cartAPI } from '../services/api';

const CART_STORAGE_KEY = 'furnihub_cart';

export const isUserLoggedIn = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
};

export const getCartItems = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  if (!isUserLoggedIn()) {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (_) {}
    return [];
  }

  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    const raw = storedCart ? JSON.parse(storedCart) : [];

    // Deduplicate by product id
    const consolidated = [];
    raw.forEach(item => {
      const existing = consolidated.find(c => c.id === item.id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        consolidated.push({ ...item });
      }
    });

    return consolidated;
  } catch {
    return [];
  }
};

export const saveCartItems = (items) => {
  if (typeof window === 'undefined') {
    return items;
  }

  // Deduplicate by product id before saving
  const consolidated = [];
  items.forEach(item => {
    const existing = consolidated.find(c => c.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      consolidated.push({ ...item });
    }
  });

  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(consolidated));
  window.dispatchEvent(new Event('cart:updated'));
  return consolidated;
};

export const addToCartItem = async (product, navigate) => {
  if (!isUserLoggedIn()) {
    alert('Please login or signup to add items to cart!');
    if (navigate) {
      navigate('/login');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return { success: false, requireAuth: true };
  }

  const items = getCartItems();
  const existingItem = items.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    items.push({ ...product, quantity: 1 });
  }

  saveCartItems(items);

  try {
    await cartAPI.addToCart({ productId: product.id, quantity: 1 });
  } catch (err) {
    console.error('Failed to sync cart item with backend', err);
  }

  return { success: true };
};

export const addToCart = addToCartItem;

export const updateCartItemQuantity = async (productId, delta) => {
  const items = getCartItems();
  const itemIndex = items.findIndex((item) => item.id === productId);

  if (itemIndex === -1) return items;

  const targetItem = items[itemIndex];
  const newQty = targetItem.quantity + delta;

  let updatedItems = [];
  if (newQty <= 0) {
    updatedItems = items.filter((item) => item.id !== productId);
  } else {
    updatedItems = items.map((item) =>
      item.id === productId ? { ...item, quantity: newQty } : item
    );
  }

  saveCartItems(updatedItems);

  if (isUserLoggedIn()) {
    try {
      const targetId = targetItem.cartItemId || productId;
      await cartAPI.updateQuantity(targetId, newQty);
    } catch (err) {
      console.error('Failed to update cart quantity on backend', err);
    }
  }

  return updatedItems;
};

export const removeCartItem = async (productId) => {
  const items = getCartItems();
  const targetItem = items.find((item) => item.id === productId);
  const updatedItems = items.filter((item) => item.id !== productId);

  saveCartItems(updatedItems);

  if (isUserLoggedIn() && targetItem) {
    try {
      const targetId = targetItem.cartItemId || productId;
      await cartAPI.removeFromCart(targetId);
    } catch (err) {
      console.error('Failed to remove cart item from backend', err);
    }
  }

  return updatedItems;
};

export const clearCartItems = async () => {
  saveCartItems([]);

  if (isUserLoggedIn()) {
    try {
      await cartAPI.clearCart();
    } catch (err) {
      console.error('Failed to clear cart on backend', err);
    }
  }
};

export const fetchAndSyncBackendCart = async () => {
  const localItems = getCartItems();

  if (!isUserLoggedIn()) {
    return localItems;
  }

  try {
    const response = await cartAPI.getCart();
    if (response.data && Array.isArray(response.data)) {
      const backendItemsMap = new Map();

      response.data.forEach(item => {
        if (backendItemsMap.has(item.productId)) {
          const existing = backendItemsMap.get(item.productId);
          existing.quantity += item.quantity;
        } else {
          backendItemsMap.set(item.productId, {
            id: item.productId,
            cartItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
            description: item.description
          });
        }
      });

      const backendItems = Array.from(backendItemsMap.values());

      // Push any unsynced local items to backend
      const backendProductIds = new Set(backendItems.map(b => b.id));
      const unsyncedLocal = localItems.filter(l => !backendProductIds.has(l.id));

      if (unsyncedLocal.length > 0) {
        for (const item of unsyncedLocal) {
          try {
            await cartAPI.addToCart({ productId: item.id, quantity: item.quantity });
          } catch (e) {}
        }
        const refetched = await cartAPI.getCart();
        if (refetched.data && Array.isArray(refetched.data)) {
          const refetchedMap = new Map();
          refetched.data.forEach(item => {
            if (refetchedMap.has(item.productId)) {
              const existing = refetchedMap.get(item.productId);
              existing.quantity += item.quantity;
            } else {
              refetchedMap.set(item.productId, {
                id: item.productId,
                cartItemId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl,
                description: item.description
              });
            }
          });
          const finalItems = Array.from(refetchedMap.values());
          saveCartItems(finalItems);
          return finalItems;
        }
      }

      if (backendItems.length > 0 || localItems.length === 0) {
        saveCartItems(backendItems);
        return backendItems;
      }
    }
  } catch (err) {
    console.error('Failed to fetch cart from backend', err);
  }

  return localItems;
};

export const getCartCount = () => {
  return getCartItems().reduce((total, item) => total + item.quantity, 0);
};
