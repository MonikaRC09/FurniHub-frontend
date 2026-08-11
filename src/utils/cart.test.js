import { addToCartItem, getCartItems, getCartCount } from './cart';

// Mock window.alert to prevent jsdom errors
window.alert = jest.fn();

describe('cart helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'mock_token_for_tests');
  });

  it('adds a new product to the cart', async () => {
    await addToCartItem({ id: 1, name: 'Modern Chair', price: 12999 });
    const items = getCartItems();

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(expect.objectContaining({ id: 1, quantity: 1, price: 12999 }));
  });

  it('increments quantity for an existing product', async () => {
    await addToCartItem({ id: 1, name: 'Modern Chair', price: 12999 });
    await addToCartItem({ id: 1, name: 'Modern Chair', price: 12999 });
    const items = getCartItems();

    expect(items[0].quantity).toBe(2);
  });

  it('returns the total number of cart items', async () => {
    await addToCartItem({ id: 1, name: 'Modern Chair', price: 12999 });
    await addToCartItem({ id: 2, name: 'Dining Table', price: 34999 });
    await addToCartItem({ id: 1, name: 'Modern Chair', price: 12999 });

    expect(getCartCount()).toBe(3);
  });

  it('prevents adding to cart if user is unauthenticated', async () => {
    localStorage.clear(); // remove token
    const result = await addToCartItem({ id: 1, name: 'Modern Chair', price: 12999 });

    expect(result.success).toBe(false);
    expect(result.requireAuth).toBe(true);
    expect(getCartCount()).toBe(0);
  });
});
