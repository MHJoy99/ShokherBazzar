
import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { config } from '../config';
import { useToast } from '../context/ToastContext';
import { Coupon } from '../types';

export const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { user, register } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'uddoktapay' | 'manual'>('uddoktapay');
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [orderId, setOrderId] = useState<number | null>(null);
  
  // SECURE TOKEN STATE
  const [guestToken, setGuestToken] = useState<string | null>(null);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);

  // ERROR MODAL STATE
  const [paymentError, setPaymentError] = useState(false);

  // NEW: Detect return from Payment Gateway
  const [searchParams] = useSearchParams();
  const verificationRun = useRef(false);

  useEffect(() => {
      const status = searchParams.get('status');
      const oid = searchParams.get('order_id');
      const invoice = searchParams.get('invoice_id'); 
      const token = searchParams.get('token'); // Get Token from URL
      
      if ((status === 'success' || status === 'completed') && (oid || invoice)) {
          const finalId = oid ? parseInt(oid) : (invoice ? parseInt(invoice) : 0);
          setOrderId(finalId);
          if(token) setGuestToken(token); // Save token for display
          
          setStep(3);
          clearCart();
          
          if (!verificationRun.current && finalId > 0) {
              verificationRun.current = true;
              api.verifyPayment(finalId, invoice || undefined);
          }
      }
  }, [searchParams, clearCart]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      showToast("Copied!", "success");
  };

  const handleApplyCoupon = async () => {
      if (!couponCode) return;
      setVerifyingCoupon(true);
      try {
          const coupon = await api.getCoupon(couponCode);
          if (coupon) {
              setAppliedCoupon(coupon);
              showToast("Coupon Applied!", "success");
          } else {
              showToast("Invalid Coupon Code", "error");
              setAppliedCoupon(null);
          }
      } catch (e) {
          showToast("Failed to verify coupon", "error");
      } finally {
          setVerifyingCoupon(false);
      }
  };

  const calculateDiscount = () => {
      if (!appliedCoupon) return 0;
      if (appliedCoupon.discount_type === 'percent') {
          return cartTotal * (parseFloat(appliedCoupon.amount) / 100);
      } else {
          return parseFloat(appliedCoupon.amount);
      }
  };

  const discountAmount = calculateDiscount();
  const finalTotal = Math.max(0, cartTotal - discountAmount);
  const isFreeOrder = finalTotal === 0;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPaymentError(false);
    try {
        let customerId = user?.id;

        if (!user && createAccount && password) {
             try {
                const newUser = await register({
                    email: formData.email,
                    password: password,
                    first_name: formData.first_name,
                    last_name: formData.last_name
                });
                customerId = newUser?.id;
             } catch (regError) {
                 alert("Account creation failed. Email might be in use. Proceeding as guest.");
             }
        }

        const result = await api.createOrder({ 
            items, 
            billing: formData, 
            payment_method: isFreeOrder ? 'manual' : paymentMethod, 
            trxId: paymentMethod === 'manual' ? trxId : undefined, 
            senderNumber: paymentMethod === 'manual' ? senderNumber : undefined,
            customer_id: customerId,
            coupon_code: appliedCoupon?.code
        });

        if (result.success) {
            setOrderId(result.id);
            if(result.guest_token) setGuestToken(result.guest_token); // Capture Token

            if (isFreeOrder) {
                clearCart();
                setStep(3);
            } else if (result.payment_url) { 
                window.location.href = result.payment_url; 
            } else { 
                if (paymentMethod === 'uddoktapay') {
                    setPaymentError(true);
                } else {
                    clearCart();
                    setStep(3); 
                }
            }
        }
    } catch (error) { alert("Order failed. Please try again."); } finally { setLoading(false); }
  };

  const getItemKey = (item: any) => `${item.id}-${item.selectedVariation?.id || 'default'}-${item.custom_price || 'std'}`;
  const StepWizard = () => (
    <div className="flex items-center justify-center mb-12">
        <div className="flex items-center gap-4">
            <span className={`text-sm font-bold uppercase tracking-widest ${step >= 1 ? 'text-primary' : 'text-gray-600'}`}>01 Cart</span>
            <span className="text-gray-700">/</span>
            <span className={`text-sm font-bold uppercase tracking-widest ${step >= 2 ? 'text-primary' : 'text-gray-600'}`}>02 Checkout</span>
            <span className="text-gray-700">/</span>
            <span className={`text-sm font-bold uppercase tracking-widest ${step >= 3 ? 'text-primary' : 'text-gray-600'}`}>03 Done</span>
        </div>
    </div>
  );

  if (step === 3) {
    const trackingLink = `${window.location.origin}/track-order?order_id=${orderId}&email=${encodeURIComponent(formData.email || user?.email || '')}${guestToken ? `&token=${guestToken}` : ''}`;

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Helmet><title>Order Completed | {config.siteName}</title></Helmet>
        <div className="bg-dark-900 p-8 rounded-2xl border border-primary/20 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-glow"></div>
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20"><i className="fas fa-check text-4xl text-primary"></i></div>
          <h2 className="text-3xl font-black text-white mb-2 uppercase italic">Order Completed!</h2>
          <div className="bg-dark-900 p-4 rounded-xl mb-6 border border-white/10">
              <p className="text-gray-500 text-xs font-bold uppercase">Order Number</p>
              <p className="text-2xl font-black text-white tracking-widest">#{orderId}</p>
          </div>
          <p className="text-gray-400 mb-8 text-sm">{paymentMethod === 'manual' && !isFreeOrder ? 'We are verifying your transaction ID. You will receive codes via email shortly.' : `Thank you! Your payment is verified. Check your email for codes.`}</p>
          
          {/* TRACKING LINK FOR GUESTS */}
          {guestToken && (
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl mb-8">
                  <p className="text-blue-400 text-xs font-bold uppercase mb-2"><i className="fas fa-lock"></i> Secure Tracking Link</p>
                  <p className="text-gray-400 text-[10px] mb-3">Save this link to access your codes without logging in.</p>
                  <div className="flex gap-2">
                      <input type="text" readOnly value={trackingLink} className="w-full bg-dark-950 border border-white/10 rounded px-2 text-[10px] text-gray-400" />
                      <button onClick={() => copyToClipboard(trackingLink)} className="bg-blue-500 hover:bg-blue-400 text-white text-xs px-3 rounded font-bold">Copy</button>
                  </div>
              </div>
          )}

          <div className="flex gap-4">
              <a href={trackingLink} className="flex-1 bg-dark-800 hover:bg-dark-700 text-white font-bold uppercase py-4 rounded-xl transition-all border border-white/10 text-xs">View Keys</a>
              <Link to="/" className="flex-1 bg-primary hover:bg-primary-hover text-black font-black uppercase py-4 rounded-xl transition-all shadow-glow text-xs flex items-center justify-center">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <Helmet><title>Checkout | {config.siteName}</title></Helmet>
      
      {/* ERROR MODAL FOR FAILED GATEWAY */}
      {paymentError && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
               <div className="bg-dark-900 border-2 border-orange-500 rounded-2xl w-full max-w-md p-8 shadow-2xl relative text-center">
                   <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500 text-3xl">
                       <i className="fas fa-exclamation-triangle"></i>
                   </div>
                   <h2 className="text-xl font-black uppercase text-white mb-2">Gateway Busy</h2>
                   <p className="text-gray-400 mb-6 text-sm">
                       The automatic payment gateway is taking too long to respond. Don't worry, your order <b>#{orderId}</b> is created!
                       <br/><br/>
                       Please use <b>Manual Send Money</b> instead.
                   </p>
                   <button onClick={() => { setPaymentMethod('manual'); setPaymentError(false); }} className="w-full bg-primary text-black font-bold uppercase py-3 rounded-xl shadow-glow">
                       Switch to Manual Payment
                   </button>
               </div>
           </div>
       )}

      <div className="text-center mb-10"><h1 className="text-4xl font-black text-white mb-2 uppercase italic">{step === 1 ? 'Your Cart' : 'Secure Checkout'}</h1></div>
      <StepWizard />
      {step === 1 && (
         <>
            {items.length === 0 ? (
                <div className="text-center py-24 bg-dark-900/50 rounded-2xl border border-white/5">
                    <p className="text-gray-500 mb-8 font-mono">Your inventory is empty.</p>
                    <Link to="/" className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded font-bold uppercase tracking-wider transition-all border border-white/10">Start Shopping</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <AnimatePresence>
                    {items.map(item => {
                        const key = getItemKey(item);
                        // Handle custom bundle price
                        let price = item.price;
                        if (item.custom_price) {
                            price = item.custom_price;
                        } else if (item.selectedVariation) {
                            price = item.selectedVariation.price;
                        } else if (item.on_sale && item.sale_price) {
                            price = item.sale_price;
                        }

                        // Safety fallback for images
                        const imgSrc = item.images && item.images.length > 0 ? item.images[0].src : "https://placehold.co/400?text=No+Image";

                        return (
                            <motion.div key={key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} className="bg-dark-900 p-4 rounded-xl border border-white/5 flex gap-5 items-center group">
                                <div className="w-20 h-20 flex-shrink-0 bg-dark-950 rounded overflow-hidden border border-white/5">
                                    <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-bold text-sm uppercase tracking-wide">
                                        {item.name} {item.selectedVariation ? `- ${item.selectedVariation.name}` : ''}
                                    </h3>
                                    <div className="text-primary text-xs font-bold mt-1">৳{parseFloat(price).toFixed(2)}</div>
                                </div>
                                <div className="flex items-center bg-dark-950 rounded border border-white/10"><button onClick={() => updateQuantity(key, item.quantity - 1)} className="w-8 h-8 text-gray-400 hover:text-white">-</button><span className="w-8 text-center text-white text-xs font-bold">{item.quantity}</span><button onClick={() => updateQuantity(key, item.quantity + 1)} className="w-8 h-8 text-gray-400 hover:text-white">+</button></div>
                                <div className="text-right min-w-[80px]"><span className="block text-lg font-black text-white">৳{(parseFloat(price) * item.quantity).toFixed(0)}</span></div>
                                <button onClick={() => removeFromCart(key)} className="text-gray-600 hover:text-red-500 transition-colors p-2"><i className="fas fa-times"></i></button>
                            </motion.div>
                        );
                    })}
                    </AnimatePresence>
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-dark-900 p-6 rounded-2xl border border-white/10 sticky top-24">
                        {/* COUPON SECTION */}
                        <div className="mb-6 border-b border-white/5 pb-6">
                            <p className="text-gray-400 text-xs uppercase font-bold mb-2">Have a Coupon?</p>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={couponCode} 
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    placeholder="Enter Code" 
                                    className="bg-dark-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm w-full focus:border-primary focus:outline-none" 
                                />
                                <button 
                                    onClick={handleApplyCoupon} 
                                    disabled={verifyingCoupon}
                                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase px-4 rounded-lg transition-colors"
                                >
                                    {verifyingCoupon ? '...' : 'Apply'}
                                </button>
                            </div>
                            {appliedCoupon && (
                                <div className="mt-2 text-green-500 text-xs font-bold flex items-center gap-1">
                                    <i className="fas fa-check-circle"></i> Applied: {appliedCoupon.code}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between items-center text-gray-400 text-sm">
                                <span>Subtotal</span>
                                <span>৳{cartTotal.toFixed(0)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between items-center text-green-500 text-sm font-bold">
                                    <span>Discount</span>
                                    <span>-৳{discountAmount.toFixed(0)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-end pt-4 border-t border-white/5">
                                <span className="text-white text-sm uppercase font-bold">Total Pay</span>
                                <span className="text-3xl font-black text-primary">৳{finalTotal.toFixed(0)}</span>
                            </div>
                        </div>
                        <button onClick={() => setStep(2)} className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase italic tracking-wider py-4 rounded-xl shadow-glow transition-all">Checkout</button>
                    </div>
                </div>
                </div>
            )}
         </>
      )}

      {step === 2 && (
          <div className="max-w-xl mx-auto">
              <form onSubmit={handleCheckout} className="space-y-6">
                  <div className="bg-dark-900 p-8 rounded-2xl border border-white/10">
                      <h3 className="text-lg font-black text-white uppercase italic mb-6">Billing Info</h3>
                      <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                              <input name="first_name" onChange={handleInputChange} required type="text" placeholder="First Name" className="bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" />
                              <input name="last_name" onChange={handleInputChange} required type="text" placeholder="Last Name" className="bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" />
                          </div>
                          <input name="email" onChange={handleInputChange} required type="email" placeholder="Email Address" className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" />
                          <input name="phone" onChange={handleInputChange} required type="tel" placeholder="Phone Number" className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" />
                          
                          {/* OPTIONAL REGISTRATION FOR GUESTS */}
                          {!user && (
                              <div className="pt-4 border-t border-white/5 mt-4">
                                  <label className="flex items-center gap-3 cursor-pointer group">
                                      <input type="checkbox" checked={createAccount} onChange={(e) => setCreateAccount(e.target.checked)} className="w-5 h-5 rounded border-white/20 bg-dark-950 checked:bg-primary" />
                                      <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Create an account for future orders?</span>
                                  </label>
                                  {createAccount && (
                                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4">
                                          <input 
                                            type="password" 
                                            placeholder="Create a strong password" 
                                            required={createAccount}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                          />
                                          <p className="text-[10px] text-gray-500 mt-2">You will be automatically logged in after purchase.</p>
                                      </motion.div>
                                  )}
                              </div>
                          )}
                      </div>
                  </div>
                   
                   {!isFreeOrder && (
                        <div className="bg-dark-900 p-8 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-black text-white uppercase italic mb-6">Select Payment Method</h3>
                            
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {/* AUTOMATIC PAYMENT CARD */}
                                <button 
                                    type="button" 
                                    onClick={() => setPaymentMethod('uddoktapay')} 
                                    className={`relative p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-3 group overflow-hidden ${paymentMethod === 'uddoktapay' ? 'bg-primary/10 border-primary shadow-glow-sm' : 'bg-dark-900 border-white/10 hover:border-white/20'}`}
                                >
                                    {paymentMethod === 'uddoktapay' && <div className="absolute top-2 right-2 text-primary"><i className="fas fa-check-circle"></i></div>}
                                    <div className="flex items-center gap-2 grayscale group-hover:grayscale-0 transition-all opacity-80 group-hover:opacity-100">
                                        <div className="w-10 h-10 rounded-full bg-white p-1 shadow-sm overflow-hidden flex items-center justify-center">
                                            <img src="https://freepnglogo.com/images/all_img/1701503524bkash-logo-transparent.png" className="h-full object-contain" alt="bKash" />
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-white p-1 shadow-sm overflow-hidden flex items-center justify-center">
                                            <img src="https://freepnglogo.com/images/all_img/1701511252nagad-logo-transparent.png" className="h-full object-contain" alt="Nagad" />
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-white p-1 shadow-sm overflow-hidden flex items-center justify-center">
                                            <img src="https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D1CC458D-seeklogo.com.png" className="h-full object-contain" alt="Rocket" />
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-white uppercase">{config.payment.methodTitle}</span>
                                    <span className="text-[10px] text-green-500">Automated • Instant</span>
                                </button>

                                {/* MANUAL PAYMENT CARD */}
                                <button 
                                    type="button" 
                                    onClick={() => setPaymentMethod('manual')} 
                                    className={`relative p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-3 group ${paymentMethod === 'manual' ? 'bg-primary/10 border-primary shadow-glow-sm' : 'bg-dark-900 border-white/10 hover:border-white/20'}`}
                                >
                                    {paymentMethod === 'manual' && <div className="absolute top-2 right-2 text-primary"><i className="fas fa-check-circle"></i></div>}
                                    <i className="fas fa-hand-holding-usd text-2xl text-gray-400 group-hover:text-white transition-colors"></i>
                                    <span className="text-xs font-bold text-white uppercase">Manual Send Money</span>
                                    <span className="text-[10px] text-gray-500">Manual Verification</span>
                                </button>
                            </div>

                            {/* MANUAL INSTRUCTIONS */}
                            <AnimatePresence>
                                {paymentMethod === 'manual' && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div className="bg-dark-950 p-6 rounded-xl border border-white/5 mb-6">
                                            <p className="text-gray-400 text-xs mb-4">{config.payment.manualInstructions}</p>
                                            <div className="space-y-3 mb-6">
                                                {config.payment.bkashPersonal && (
                                                    <div className="flex justify-between items-center bg-dark-900 p-3 rounded border border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-white p-1 shadow-sm overflow-hidden flex items-center justify-center">
                                                                <img src="https://freepnglogo.com/images/all_img/1701503524bkash-logo-transparent.png" className="h-full object-contain" alt="bKash" />
                                                            </div>
                                                            <span className="text-white font-bold text-sm">bKash Personal</span>
                                                        </div>
                                                        <div className="flex items-center gap-3"><span className="font-mono text-gray-300">{config.payment.bkashPersonal}</span><button type="button" onClick={() => copyToClipboard(config.payment.bkashPersonal)} className="text-primary hover:text-white"><i className="fas fa-copy"></i></button></div>
                                                    </div>
                                                )}
                                                {config.payment.nagadPersonal && (
                                                    <div className="flex justify-between items-center bg-dark-900 p-3 rounded border border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-white p-1 shadow-sm overflow-hidden flex items-center justify-center">
                                                                <img src="https://freepnglogo.com/images/all_img/1701511252nagad-logo-transparent.png" className="h-full object-contain" alt="Nagad" />
                                                            </div>
                                                            <span className="text-white font-bold text-sm">Nagad Personal</span>
                                                        </div>
                                                        <div className="flex items-center gap-3"><span className="font-mono text-gray-300">{config.payment.nagadPersonal}</span><button type="button" onClick={() => copyToClipboard(config.payment.nagadPersonal)} className="text-primary hover:text-white"><i className="fas fa-copy"></i></button></div>
                                                    </div>
                                                )}
                                                {config.payment.rocketPersonal && config.payment.rocketPersonal !== "0000-000000" && (
                                                    <div className="flex justify-between items-center bg-dark-900 p-3 rounded border border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-white p-1 shadow-sm overflow-hidden flex items-center justify-center">
                                                                <img src="https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D1CC458D-seeklogo.com.png" className="h-full object-contain" alt="Rocket" />
                                                            </div>
                                                            <span className="text-white font-bold text-sm">Rocket Personal</span>
                                                        </div>
                                                        <div className="flex items-center gap-3"><span className="font-mono text-gray-300">{config.payment.rocketPersonal}</span><button type="button" onClick={() => copyToClipboard(config.payment.rocketPersonal)} className="text-primary hover:text-white"><i className="fas fa-copy"></i></button></div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-4">
                                                <div><label className="block text-xs font-bold uppercase text-gray-500 mb-2">Your Sender Number</label><input type="text" required value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} placeholder="017xxxxxxxx" className="w-full bg-dark-900 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" /></div>
                                                <div><label className="block text-xs font-bold uppercase text-gray-500 mb-2">Transaction ID (TrxID)</label><input type="text" required value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="e.g. 9G7HG6..." className="w-full bg-dark-900 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" /></div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                   )}

                  <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black uppercase italic tracking-widest py-5 rounded-2xl shadow-glow text-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:scale-100">
                      {loading ? 'Processing...' : isFreeOrder ? 'Place Free Order' : `Pay ৳${finalTotal.toFixed(0)} Now`}
                  </button>
              </form>
          </div>
      )}
    </div>
  );
};
