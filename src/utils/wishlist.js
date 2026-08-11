const WISHLIST_STORAGE_KEY = 'furnihub_wishlist';

export const isUserLoggedIn = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
};

export const getWishlistItems = () => {
  if (!isUserLoggedIn()) {
    try {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
    } catch (_) {}
    return [];
  }
  try {
    const data = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error reading wishlist from localStorage:', err);
    return [];
  }
};

export const isInWishlist = (productId) => {
  const items = getWishlistItems();
  return items.some(item => (item.id || item.productId) === productId);
};

export const toggleWishlistItem = (product) => {
  let items = getWishlistItems();
  const prodId = product.id || product.productId;
  const index = items.findIndex(item => (item.id || item.productId) === prodId);

  if (index > -1) {
    items.splice(index, 1);
  } else {
    items.push({
      id: prodId,
      productId: prodId,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      categoryName: product.categoryName || product.parentCategoryName || 'Furniture',
      rating: product.rating || 4.5,
      addedAt: new Date().toISOString()
    });
  }

  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('wishlist:updated'));
  } catch (err) {
    console.error('Error saving wishlist:', err);
  }

  return items;
};

export const removeFromWishlist = (productId) => {
  let items = getWishlistItems();
  items = items.filter(item => (item.id || item.productId) !== productId);
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('wishlist:updated'));
  } catch (err) {
    console.error('Error removing from wishlist:', err);
  }
  return items;
};

export const clearWishlistItems = () => {
  try {
    localStorage.removeItem(WISHLIST_STORAGE_KEY);
    window.dispatchEvent(new Event('wishlist:updated'));
  } catch (err) {
    console.error('Error clearing wishlist:', err);
  }
};
