
import React, { useState, useEffect } from 'react';
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
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);

  // ERROR MODAL STATE
  const [paymentError, setPaymentError] = useState(false);

  // NEW: Detect return from Payment Gateway
  const [searchParams] = useSearchParams();

  useEffect(() => {
      const status = searchParams.get('status');
      const oid = searchParams.get('order_id');
      const invoice = searchParams.get('invoice_id'); 
      
      // Accept 'success' OR 'completed' as valid status
      // STABILITY FIX: Removed verifyPayment call to prevent infinite loops.
      // We assume if the user is redirected here with success, it worked.
      if ((status === 'success' || status === 'completed') && (oid || invoice)) {
          const finalId = oid ? parseInt(oid) : (invoice ? parseInt(invoice) : 0);
          setOrderId(finalId);
          setStep(3);
          clearCart();
          showToast("Order Completed!", "success");
      }
  }, [searchParams, clearCart, showToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      showToast("Number Copied!", "success");
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

        // Auto-Register if requested
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
            if (isFreeOrder) {
                clearCart();
                setStep(3);
            } else if (result.payment_url) { 
                // Redirect to Payment Gateway (Direct)
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

  const getItemKey = (item: any) => `${item.id}-${item.selectedVariation?.id || 'default'}`;
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
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Helmet><title>Order Completed | {config.siteName}</title></Helmet>
        <div className="bg-dark-900 p-8 rounded-2xl border border-primary/20 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-glow"></div>
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20"><i className="fas fa-check text-4xl text-primary"></i></div>
          <h2 className="text-3xl font-black text-white mb-2 uppercase italic">Order Completed!</h2>
          <div className="bg-dark-950 p-4 rounded-xl mb-6 border border-white/10">
              <p className="text-gray-500 text-xs font-bold uppercase">Order Number</p>
              <p className="text-2xl font-black text-white tracking-widest">#{orderId}</p>
          </div>
          <p className="text-gray-400 mb-8 text-sm">{paymentMethod === 'manual' && !isFreeOrder ? 'We are verifying your transaction ID. You will receive codes via email shortly.' : `Thank you! Your payment is verified. Check your email for codes.`}</p>
          <Link to="/" className="inline-block w-full bg-primary hover:bg-primary-hover text-black font-black uppercase py-4 rounded-xl transition-all shadow-glow">Continue Shopping</Link>
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
                        const price = item.selectedVariation ? item.selectedVariation.price : (item.on_sale && item.sale_price ? item.sale_price : item.price);
                        return (
                            <motion.div key={key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} className="bg-dark-900 p-4 rounded-xl border border-white/5 flex gap-5 items-center group">
                            <div className="w-20 h-20 flex-shrink-0 bg-dark-950 rounded overflow-hidden border border-white/5"><img src={item.images[0].src} alt={item.name} className="w-full h-full object-cover" /></div>
                            <div className="flex-1"><h3 className="text-white font-bold text-sm uppercase tracking-wide">{item.selectedVariation ? item.selectedVariation.name : item.name}</h3><div className="text-primary text-xs font-bold mt-1">৳{price}</div></div>
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
                                    className={`relative p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-3 group overflow-hidden ${paymentMethod === 'uddoktapay' ? 'bg-primary/10 border-primary shadow-glow-sm' : 'bg-dark-950 border-white/10 hover:border-white/20'}`}
                                >
                                    {paymentMethod === 'uddoktapay' && <div className="absolute top-2 right-2 text-primary"><i className="fas fa-check-circle"></i></div>}
                                    <div className="flex items-center gap-2 grayscale group-hover:grayscale-0 transition-all opacity-80 group-hover:opacity-100">
                                        <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white text-[10px] font-bold">bKash</div>
                                        <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white text-[10px] font-bold">Nagad</div>
                                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-[10px] font-bold">Rckt</div>
                                    </div>
                                    <div className="text-center">
                                        <p className={`font-black uppercase text-sm ${paymentMethod === 'uddoktapay' ? 'text-white' : 'text-gray-400'}`}>{config.payment.methodTitle}</p>
                                        <p className="text-[10px] text-gray-500">Automated & Secure</p>
                                    </div>
                                </button>

                                {/* MANUAL PAYMENT CARD */}
                                <button 
                                    type="button" 
                                    onClick={() => setPaymentMethod('manual')} 
                                    className={`relative p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-3 group ${paymentMethod === 'manual' ? 'bg-white/10 border-white shadow-lg' : 'bg-dark-950 border-white/10 hover:border-white/20'}`}
                                >
                                    {paymentMethod === 'manual' && <div className="absolute top-2 right-2 text-white"><i className="fas fa-check-circle"></i></div>}
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform">
                                        <i className="fas fa-paper-plane"></i>
                                    </div>
                                    <div className="text-center">
                                        <p className={`font-black uppercase text-sm ${paymentMethod === 'manual' ? 'text-white' : 'text-gray-400'}`}>Send Money</p>
                                        <p className="text-[10px] text-gray-500">Manual Verification</p>
                                    </div>
                                </button>
                            </div>

                            <AnimatePresence mode='wait'>
                                {paymentMethod === 'uddoktapay' ? (
                                    <motion.div 
                                        key="auto"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-4"
                                    >
                                        <div className="w-12 h-12 bg-dark-950 rounded-lg flex items-center justify-center text-primary text-xl shadow-glow-sm">
                                            <i className="fas fa-bolt"></i>
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">Best Choice</p>
                                            <p className="text-xs text-gray-400">Payment confirms instantly. No waiting.</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="manual"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4"
                                    >
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                                            <p className="text-sm text-gray-300 mb-4">{config.payment.manualInstructions}</p>
                                            
                                            <div className="grid gap-3">
                                                <div className="flex items-center justify-between bg-dark-950 p-3 rounded-lg border border-pink-500/30 relative overflow-hidden">
                                                    <div className="absolute left-0 top-0 w-1 h-full bg-pink-500"></div>
                                                    <span className="text-pink-500 font-bold text-xs uppercase ml-2">bKash Personal</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-white font-mono font-bold">{config.payment.bkashPersonal}</span>
                                                        <button type="button" onClick={() => copyToClipboard(config.payment.bkashPersonal)} className="text-gray-500 hover:text-white"><i className="fas fa-copy"></i></button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between bg-dark-950 p-3 rounded-lg border border-orange-500/30 relative overflow-hidden">
                                                    <div className="absolute left-0 top-0 w-1 h-full bg-orange-500"></div>
                                                    <span className="text-orange-500 font-bold text-xs uppercase ml-2">Nagad Personal</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-white font-mono font-bold">{config.payment.nagadPersonal}</span>
                                                        <button type="button" onClick={() => copyToClipboard(config.payment.nagadPersonal)} className="text-gray-500 hover:text-white"><i className="fas fa-copy"></i></button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between bg-dark-950 p-3 rounded-lg border border-purple-500/30 relative overflow-hidden">
                                                    <div className="absolute left-0 top-0 w-1 h-full bg-purple-500"></div>
                                                    <span className="text-purple-500 font-bold text-xs uppercase ml-2">Rocket Personal</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-white font-mono font-bold">{config.payment.rocketPersonal}</span>
                                                        <button type="button" onClick={() => copyToClipboard(config.payment.rocketPersonal)} className="text-gray-500 hover:text-white"><i className="fas fa-copy"></i></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-white/5">
                                            <input type="text" placeholder="Enter Transaction ID (TrxID)" className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-white outline-none font-mono" required={paymentMethod === 'manual'} value={trxId} onChange={(e) => setTrxId(e.target.value)} />
                                            <input type="text" placeholder="Your Sender Number" className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-white outline-none" required={paymentMethod === 'manual'} value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                   )}

                  <button disabled={loading} type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-black uppercase italic tracking-wider py-4 rounded-xl shadow-glow transition-all">
                    {loading ? 'Processing...' : (isFreeOrder ? 'Place Free Order' : (paymentMethod === 'uddoktapay' ? `Pay ৳${finalTotal.toFixed(0)} Now` : `Verify Payment ৳${finalTotal.toFixed(0)}`))}
                  </button>
              </form>
          </div>
      )}
    </div>
  );
};
