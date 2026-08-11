import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { FiPackage, FiCheckCircle } from 'react-icons/fi';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ChangePassword from './pages/ChangePassword';
import Categories from './pages/Categories';
import ProductDetail from './pages/ProductDetail';
import Wishlist from './pages/Wishlist';
import Customer from './pages/Customer';
import Admin from './pages/Admin';
import Footer from './components/Footer';
import { paymentAPI, orderAPI } from './services/api';
import { fetchAndSyncBackendCart, isUserLoggedIn, updateCartItemQuantity, getCartItems } from './utils/cart';
import './App.css';

const CartPage = () => {
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [checkoutMessageType, setCheckoutMessageType] = useState('info');
  const [orderStatus, setOrderStatus] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiPassword, setUpiPassword] = useState('');
  const [bankName, setBankName] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cardNickname, setCardNickname] = useState('Personal');
  const [addressFullName, setAddressFullName] = useState('');
  const [addressPhone, setAddressPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [pincode, setPincode] = useState('');
  const [addressError, setAddressError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState(null);

  useEffect(() => {
    // 1. Initial mount: load local cart immediately, then perform 1-time backend sync
    const initialSync = async () => {
      setItems(getCartItems());
      if (isUserLoggedIn()) {
        try {
          const syncedItems = await fetchAndSyncBackendCart();
          setItems(syncedItems);
        } catch (_) {}
      }
    };

    initialSync();

    // 2. Local cart change listener: update local state instantly without refetching backend
    const handleLocalCartChange = () => {
      setItems(getCartItems());
    };

    window.addEventListener('cart:updated', handleLocalCartChange);
    return () => window.removeEventListener('cart:updated', handleLocalCartChange);
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'FURNI10') {
      const disc = Math.round(subtotal * 0.10);
      setAppliedCoupon({ code: 'FURNI10', discountAmount: disc, label: '10% Instant Discount' });
      setCouponMessage({ type: 'success', text: `Coupon FURNI10 applied! Saved ₹${disc.toLocaleString('en-IN')}` });
    } else if (code === 'FURNI2000') {
      if (subtotal < 15000) {
        setCouponMessage({ type: 'error', text: 'FURNI2000 requires a minimum cart value of ₹15,000.' });
        return;
      }
      setAppliedCoupon({ code: 'FURNI2000', discountAmount: 2000, label: 'Flat ₹2,000 Off' });
      setCouponMessage({ type: 'success', text: 'Coupon FURNI2000 applied! Saved ₹2,000' });
    } else if (code === 'WELCOME500') {
      const disc = Math.min(subtotal, 500);
      setAppliedCoupon({ code: 'WELCOME500', discountAmount: disc, label: '₹500 Welcome Discount' });
      setCouponMessage({ type: 'success', text: `Coupon WELCOME500 applied! Saved ₹${disc.toLocaleString('en-IN')}` });
    } else {
      setCouponMessage({ type: 'error', text: 'Invalid promo coupon code. Try FURNI10, FURNI2000, or WELCOME500.' });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMessage(null);
  };

  const updateQuantity = async (itemId, delta) => {
    const updatedItems = await updateCartItemQuantity(itemId, delta);
    setItems(updatedItems);
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const resetPaymentFields = () => {
    setUpiId('');
    setUpiPassword('');
    setBankName('');
    setCardHolderName('');
    setCardNumber('');
    setExpiryDate('');
    setCardNickname('Personal');
    setCheckoutMessage('');
    setPaymentError('');
    setAddressError('');
  };

  const validateAddress = () => {
    if (!addressFullName.trim() || !addressPhone.trim() || !addressLine1.trim() || !city.trim() || !stateRegion.trim() || !pincode.trim()) {
      setAddressError('Please fill in all required address fields.');
      return false;
    }
    if (!/^\d{10}$/.test(addressPhone.replace(/^\+91/, '').trim())) {
      setAddressError('Please enter a valid 10-digit phone number.');
      return false;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      setAddressError('Please enter a valid 6-digit pincode.');
      return false;
    }
    setAddressError('');
    return true;
  };

  const formattedAddress = () => {
    const parts = [addressLine1, addressLine2, city, stateRegion, pincode].filter(Boolean);
    return parts.join(', ');
  };

  const persistOrderToBackend = async (methodLabel) => {
    try {
      const orderItems = items.map(item => ({
        productId: item.id || item.productId,
        productName: item.name || item.productName,
        imageUrl: item.imageUrl || null,
        quantity: item.quantity,
        pricePerUnit: item.price
      }));

      const newOrderPayload = {
        totalAmount: finalTotal,
        paymentMethod: methodLabel,
        deliveryAddress: `${addressFullName}, ${formattedAddress()}`,
        items: orderItems
      };

      const res = await orderAPI.createOrder(newOrderPayload);
      const createdOrder = res?.data;

      // Store created order from backend response if available
      try {
        const storedLocalOrders = JSON.parse(localStorage.getItem('furnihub_user_orders') || '[]');
        if (createdOrder && createdOrder.orderId) {
          const updatedLocal = [createdOrder, ...storedLocalOrders.filter(o => o.orderId !== createdOrder.orderId)];
          localStorage.setItem('furnihub_user_orders', JSON.stringify(updatedLocal));
        }
      } catch (e) {}
    } catch (err) {
      console.error('Failed to persist order to backend, fallback to local order', err);
      try {
        const orderItems = items.map(item => ({
          productId: item.id || item.productId,
          productName: item.name || item.productName,
          imageUrl: item.imageUrl || null,
          quantity: item.quantity,
          pricePerUnit: item.price
        }));
        const storedLocalOrders = JSON.parse(localStorage.getItem('furnihub_user_orders') || '[]');
        const localOrderObj = {
          orderId: 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          totalAmount: finalTotal,
          status: 'SUCCESS',
          paymentMethod: methodLabel,
          deliveryAddress: `${addressFullName}, ${formattedAddress()}`,
          createdAt: new Date().toISOString(),
          deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          items: orderItems.map((item, idx) => ({
            id: idx + 1,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            totalPrice: item.pricePerUnit * item.quantity,
            imageUrl: item.imageUrl
          }))
        };
        localStorage.setItem('furnihub_user_orders', JSON.stringify([localOrderObj, ...storedLocalOrders]));
      } catch (e) {}
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      setCheckoutMessage('Your cart is empty. Add a product before checkout.');
      setCheckoutMessageType('error');
      setPaymentError('');
      return;
    }

    if (!validateAddress()) {
      return;
    }

    const selectedPaymentMethod = document.querySelector('input[name="payment"]:checked')?.value || paymentMethod || 'cod';
    const paymentLabel = selectedPaymentMethod === 'card'
      ? 'Card'
      : selectedPaymentMethod === 'upi'
        ? 'UPI'
        : selectedPaymentMethod === 'razorpay'
          ? 'Razorpay'
          : 'Cash on Delivery';

    if (selectedPaymentMethod === 'upi') {
      if (!upiId.trim() || !upiPassword.trim()) {
        setCheckoutMessage('Please enter your UPI ID and password to continue.');
        setCheckoutMessageType('error');
        setPaymentError('');
        return;
      }

      await persistOrderToBackend(paymentLabel);

      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 5);

      setOrderStatus({
        status: 'Confirmed',
        paymentMethod: paymentLabel,
        deliveryDate: deliveryDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        deliveryAddress: `${addressFullName}, ${formattedAddress()}`,
      });

      setCheckoutMessage(`Payment successful! Your order has been placed via ${paymentLabel}.`);
      setCheckoutMessageType('success');
      setPaymentError('');
      localStorage.removeItem('furnihub_cart');
      setItems([]);
      window.dispatchEvent(new Event('cart:updated'));
      return;
    }

    if (selectedPaymentMethod === 'razorpay') {
      (async () => {
        try {
          let userEmail = 'customer@example.com';
          try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              userEmail = JSON.parse(storedUser).email || userEmail;
            }
          } catch (e) {}

          setCheckoutMessage('Initializing Razorpay secure payment gateway...');
          setCheckoutMessageType('info');

          // Call backend to create Razorpay Order
          const orderRes = await paymentAPI.createOrder({
            amount: subtotal,
            currency: 'INR',
            receipt: 'rcpt_' + Date.now(),
            customerName: addressFullName || 'Customer',
            customerEmail: userEmail,
            customerMobile: addressPhone || '9999999999'
          });

          const { orderId, keyId, amountInPaise, currency } = orderRes.data;

          const options = {
            key: keyId || 'rzp_test_TLJ4wDlknTTeqx',
            amount: amountInPaise || (subtotal * 100),
            currency: currency || 'INR',
            order_id: orderId,
            name: 'FurniHub',
            description: 'FurniHub Order Payment',
            image: '/logo192.png',
            handler: async function (response) {
              try {
                // Verify payment signature on backend
                await paymentAPI.verifyPayment({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                });

                await persistOrderToBackend('Razorpay');

                const deliveryDate = new Date();
                deliveryDate.setDate(deliveryDate.getDate() + 5);

                setOrderStatus({
                  status: 'Confirmed',
                  paymentMethod: 'Razorpay (Test)',
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  deliveryDate: deliveryDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }),
                  deliveryAddress: `${addressFullName}, ${formattedAddress()}`,
                });

                setCheckoutMessage(`Payment Successful! Razorpay Payment ID: ${response.razorpay_payment_id}`);
                setCheckoutMessageType('success');
                setPaymentError('');
                
                // Clear cart on successful payment
                localStorage.removeItem('furnihub_cart');
                setItems([]);
                window.dispatchEvent(new Event('cart:updated'));

              } catch (verifyError) {
                setCheckoutMessage('Payment verification failed. Please try again or contact support.');
                setCheckoutMessageType('error');
              }
            },
            prefill: {
              name: addressFullName || 'Customer',
              email: userEmail,
              contact: addressPhone || '9999999999',
            },
            notes: {
              address: formattedAddress(),
            },
            theme: {
              color: '#e67e22',
            },
          };

          if (window.Razorpay) {
            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response) {
              setCheckoutMessage(`Payment Failed: ${response.error.description || 'Payment cancelled or declined.'}`);
              setCheckoutMessageType('error');
            });
            razorpay.open();
          } else {
            setCheckoutMessage('Razorpay SDK failed to load. Please check your internet connection.');
            setCheckoutMessageType('error');
          }
        } catch (err) {
          console.error('Razorpay initialization error', err);
          setCheckoutMessage(err.response?.data?.message || 'Failed to connect to Razorpay payment server.');
          setCheckoutMessageType('error');
        }
      })();
      return;
    }

    if (selectedPaymentMethod === 'card') {
      if (!cardHolderName.trim() || !cardNumber.trim() || !expiryDate.trim() || !bankName.trim()) {
        setCheckoutMessage('Please fill in all card details to continue.');
        setCheckoutMessageType('error');
        setPaymentError('');
        return;
      }

      // Validate card number (16 digits)
      if (cardNumber.replace(/\D/g, '').length !== 16) {
        setCheckoutMessage('Please enter a valid 16-digit card number.');
        setCheckoutMessageType('error');
        setPaymentError('');
        return;
      }

      // Validate expiry date (MM/YY format)
      if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        setCheckoutMessage('Please enter expiry date in MM/YY format.');
        setCheckoutMessageType('error');
        setPaymentError('');
        return;
      }

      await persistOrderToBackend(paymentLabel);

      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 5);

      setOrderStatus({
        status: 'Confirmed',
        paymentMethod: paymentLabel,
        deliveryDate: deliveryDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        deliveryAddress: `${addressFullName}, ${formattedAddress()}`,
      });

      setCheckoutMessage(`Payment successful! Your order has been placed via ${paymentLabel}.`);
      setCheckoutMessageType('success');
      setPaymentError('');
      localStorage.removeItem('furnihub_cart');
      setItems([]);
      window.dispatchEvent(new Event('cart:updated'));
      return;
    }

    await persistOrderToBackend(paymentLabel);

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);

    setOrderStatus({
      status: 'Confirmed',
      paymentMethod: paymentLabel,
      deliveryDate: deliveryDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      deliveryAddress: `${addressFullName}, ${formattedAddress()}`,
    });

    setCheckoutMessage(`Payment successful! Your order has been placed via ${paymentLabel}.`);
    setCheckoutMessageType('success');
    setPaymentError('');
    localStorage.removeItem('furnihub_cart');
    setItems([]);
    window.dispatchEvent(new Event('cart:updated'));
  };

  return (
    <div className="page-container cart-page">
      <div className="cart-card">
        <div className="cart-header">
          <h2>Your Cart</h2>
          <p>{items.length} product{items.length === 1 ? '' : 's'} ({totalUnits} total unit{totalUnits === 1 ? '' : 's'})</p>
        </div>

        {items.length === 0 ? (
          <p className="cart-empty">Your cart is empty.</p>
        ) : (
          <>
            <ul className="cart-items-list">
              {items.map((item) => (
                <li key={item.id} className="cart-item">
                  <div className="cart-item-left">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="cart-item-img" />
                    ) : (
                      <div className="cart-item-img-placeholder"><FiPackage /></div>
                    )}
                    <div className="cart-item-info">
                      <strong className="cart-item-name">{item.name}</strong>
                      <div className="cart-item-meta">Unit price: ₹{item.price.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <div className="cart-item-right">
                    <div className="quantity-controls">
                      <button type="button" onClick={() => updateQuantity(item.id, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, 1)}>+</button>
                    </div>
                    <span className="cart-item-total">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="coupon-box-container">
              <form onSubmit={handleApplyCoupon} className="coupon-form">
                <input 
                  type="text" 
                  placeholder="Enter Promo Code (e.g. FURNI10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={!!appliedCoupon}
                />
                {appliedCoupon ? (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleRemoveCoupon}>Remove</button>
                ) : (
                  <button type="submit" className="btn btn-primary btn-sm">Apply Code</button>
                )}
              </form>
              {couponMessage && (
                <div className={`coupon-toast ${couponMessage.type}`}>
                  {couponMessage.text}
                </div>
              )}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>₹{subtotal.toLocaleString('en-IN')}</strong>
              </div>
              {appliedCoupon && (
                <div className="summary-row discount-row">
                  <span>Discount ({appliedCoupon.code})</span>
                  <strong className="text-success">- ₹{discountAmount.toLocaleString('en-IN')}</strong>
                </div>
              )}
              <div className="summary-row">
                <span>Delivery</span>
                <strong className="text-success">FREE</strong>
              </div>
              <div className="summary-row total-row">
                <span>Total Payable</span>
                <strong className="total-price">₹{finalTotal.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="address-section">
              <h3>Delivery Address</h3>
              {addressError && <p className="address-error">{addressError}</p>}
              <div className="address-form">
                <div className="address-row">
                  <label className="address-field">
                    <span>Full Name <em>*</em></span>
                    <input
                      type="text"
                      value={addressFullName}
                      onChange={(e) => setAddressFullName(e.target.value)}
                      placeholder="Enter full name"
                    />
                  </label>
                  <label className="address-field">
                    <span>Phone Number <em>*</em></span>
                    <input
                      type="tel"
                      value={addressPhone}
                      onChange={(e) => setAddressPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      maxLength="10"
                    />
                  </label>
                </div>
                <label className="address-field full-width">
                  <span>Address Line 1 <em>*</em></span>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="House no., Building, Street, Area"
                  />
                </label>
                <label className="address-field full-width">
                  <span>Address Line 2 <em>(Optional)</em></span>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Landmark, Colony"
                  />
                </label>
                <div className="address-row address-row-3">
                  <label className="address-field">
                    <span>City <em>*</em></span>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                    />
                  </label>
                  <label className="address-field">
                    <span>State <em>*</em></span>
                    <input
                      type="text"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      placeholder="State"
                    />
                  </label>
                  <label className="address-field">
                    <span>Pincode <em>*</em></span>
                    <input
                      type="tel"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit pincode"
                      maxLength="6"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="payment-section">
              <h3>Choose Payment</h3>
              <div className="payment-options">
                <label className={`payment-option ${paymentMethod === 'cod' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => {
                      resetPaymentFields();
                      setPaymentMethod('cod');
                    }}
                  />
                  Cash on Delivery
                </label>
                <label className={`payment-option ${paymentMethod === 'card' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => {
                      resetPaymentFields();
                      setPaymentMethod('card');
                    }}
                  />
                  Debit / Credit Card
                </label>
                <label className={`payment-option ${paymentMethod === 'upi' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => {
                      resetPaymentFields();
                      setPaymentMethod('upi');
                    }}
                  />
                  UPI
                </label>
                <label className={`payment-option ${paymentMethod === 'razorpay' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => {
                      resetPaymentFields();
                      setPaymentMethod('razorpay');
                    }}
                  />
                  Razorpay (Card/UPI/Wallet)
                </label>
              </div>

              {paymentMethod === 'upi' && (
                <div className="upi-form">
                  <label className="upi-field">
                    <span>UPI ID</span>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                    />
                  </label>
                  <label className="upi-field">
                    <span>UPI Password</span>
                    <input
                      type="password"
                      value={upiPassword}
                      onChange={(e) => setUpiPassword(e.target.value)}
                      placeholder="Enter password"
                    />
                  </label>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="upi-form">
                  <label className="upi-field">
                    <span>Name on Card</span>
                    <input
                      type="text"
                      value={cardHolderName}
                      onChange={(e) => setCardHolderName(e.target.value)}
                      placeholder="Enter cardholder name"
                    />
                  </label>
                  <label className="upi-field">
                    <span>Card Number</span>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="1234 5678 9012 3456"
                      maxLength="16"
                    />
                  </label>
                  <label className="upi-field">
                    <span>Expiry Date (MM/YY)</span>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length >= 2) {
                          val = val.slice(0, 2) + '/' + val.slice(2, 4);
                        }
                        setExpiryDate(val);
                      }}
                      placeholder="MM/YY"
                      maxLength="5"
                    />
                  </label>
                  <label className="upi-field">
                    <span>Bank Name</span>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Enter bank name"
                    />
                  </label>
                  <div className="card-nickname-section">
                    <span className="nickname-label">Nickname for Card</span>
                    <div className="nickname-options">
                      <label className="nickname-option">
                        <input
                          type="radio"
                          name="nickname"
                          value="Personal"
                          checked={cardNickname === 'Personal'}
                          onChange={(e) => setCardNickname(e.target.value)}
                        />
                        Personal
                      </label>
                      <label className="nickname-option">
                        <input
                          type="radio"
                          name="nickname"
                          value="Business"
                          checked={cardNickname === 'Business'}
                          onChange={(e) => setCardNickname(e.target.value)}
                        />
                        Business
                      </label>
                      <label className="nickname-option">
                        <input
                          type="radio"
                          name="nickname"
                          value="Other"
                          checked={cardNickname === 'Other'}
                          onChange={(e) => setCardNickname(e.target.value)}
                        />
                        Other
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <button className="btn btn-primary checkout-btn" onClick={handleCheckout}>
                Proceed to Pay
              </button>
              {checkoutMessage && (
                <div className={`checkout-message ${checkoutMessageType === 'success' ? 'checkout-success' : checkoutMessageType === 'error' ? 'checkout-error' : 'checkout-info'}`}>
                  {checkoutMessage}
                </div>
              )}
              {paymentError && <p className="checkout-error">{paymentError}</p>}
              {orderStatus && (
                <div className="order-status-card">
                  <h4><FiCheckCircle className="text-success mr-2" /> Order Placed Successfully!</h4>
                  <p><strong>Status:</strong> {orderStatus.status}</p>
                  <p><strong>Payment:</strong> {orderStatus.paymentMethod}</p>
                  <p><strong>Deliver to:</strong> {orderStatus.deliveryAddress}</p>
                  <p><strong>Delivery by:</strong> {orderStatus.deliveryDate}</p>
                  <Link to="/customer" className="btn btn-primary view-orders-btn mt-3">
                    <FiPackage /> View My Orders & Tracking
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };

    window.addEventListener('storage', syncAuth);
    window.addEventListener('auth:updated', syncAuth);

    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('auth:updated', syncAuth);
    };
  }, []);

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/cart" element={isAuthenticated ? <CartPage /> : <Navigate to="/login" />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route
            path="/customer"
            element={isAuthenticated ? <Customer /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Customer /> : <Navigate to="/login" />}
          />
          <Route
            path="/orders"
            element={isAuthenticated ? <Customer /> : <Navigate to="/login" />}
          />
          <Route
            path="/my-orders"
            element={isAuthenticated ? <Customer /> : <Navigate to="/login" />}
          />
          <Route
            path="/order-history"
            element={isAuthenticated ? <Customer /> : <Navigate to="/login" />}
          />
          <Route
            path="/change-password"
            element={isAuthenticated ? <ChangePassword /> : <Navigate to="/login" />}
          />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}

export default App;
