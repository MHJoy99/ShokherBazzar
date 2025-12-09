
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { config } from '../config';

export const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { user, register } = useAuth();
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'uddoktapay' | 'manual'>('uddoktapay');
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [orderId, setOrderId] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
                customerId = newUser?.id; // API returns the new user object but context might not update immediately in this scope
             } catch (regError) {
                 alert("Account creation failed. Email might be in use. Proceeding as guest.");
             }
        }

        const result = await api.createOrder({ 
            items, 
            billing: formData, 
            payment_method: paymentMethod, 
            trxId: paymentMethod === 'manual' ? trxId : undefined, 
            senderNumber: paymentMethod === 'manual' ? senderNumber : undefined,
            customer_id: customerId
        });

        if (result.success) {
            clearCart();
            setOrderId(result.id);
            if (result.payment_url) { window.location.href = result.payment_url; } else { setStep(3); }
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
        <Helmet><title>Order Confirmed | {config.siteName}</title></Helmet>
        <div className="bg-dark-900 p-8 rounded-2xl border border-primary/20 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-glow"></div>
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20"><i className="fas fa-check text-4xl text-primary"></i></div>
          <h2 className="text-3xl font-black text-white mb-2 uppercase italic">Order Placed!</h2>
          <div className="bg-dark-950 p-4 rounded-xl mb-6 border border-white/10">
              <p className="text-gray-500 text-xs font-bold uppercase">Order Number</p>
              <p className="text-2xl font-black text-white tracking-widest">#{orderId}</p>
          </div>
          <p className="text-gray-400 mb-8 text-sm">{paymentMethod === 'manual' ? 'We are verifying your transaction ID. You will receive codes via email shortly.' : `Codes sent to ${formData.email}.`}</p>
          <Link to="/" className="inline-block w-full bg-primary hover:bg-primary-hover text-black font-black uppercase py-4 rounded-xl transition-all shadow-glow">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <Helmet><title>Checkout | {config.siteName}</title></Helmet>
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
                        <div className="flex justify-between items-end mb-6"><span className="text-gray-400 text-sm uppercase font-bold">Total Pay</span><span className="text-3xl font-black text-primary">৳{cartTotal.toFixed(0)}</span></div>
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
                   <div className="bg-dark-900 p-8 rounded-2xl border border-white/10">
                      <h3 className="text-lg font-black text-white uppercase italic mb-6">Payment Method</h3>
                      <div className="flex gap-4 mb-6">
                          <button type="button" onClick={() => setPaymentMethod('uddoktapay')} className={`flex-1 py-3 px-4 rounded-xl border font-bold text-sm transition-all ${paymentMethod === 'uddoktapay' ? 'bg-primary text-black border-primary' : 'bg-dark-950 text-gray-400 border-white/10 hover:bg-white/5'}`}>Automatic Payment</button>
                          <button type="button" onClick={() => setPaymentMethod('manual')} className={`flex-1 py-3 px-4 rounded-xl border font-bold text-sm transition-all ${paymentMethod === 'manual' ? 'bg-primary text-black border-primary' : 'bg-dark-950 text-gray-400 border-white/10 hover:bg-white/5'}`}>Manual Send Money</button>
                      </div>
                      {paymentMethod === 'uddoktapay' ? (
                          <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg flex items-center gap-4">
                              <div className="w-10 h-10 rounded bg-white flex items-center justify-center p-1"><i className="fas fa-credit-card text-black"></i></div>
                              <div><p className="text-white font-bold text-sm">bKash / Nagad / Rocket</p><p className="text-xs text-gray-400">Secure automated payment via UddoktaPay</p></div>
                          </div>
                      ) : (
                          <div className="space-y-4 animate-fade-in-up">
                              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-sm text-yellow-200">{config.payment.manualInstructions}</div>
                              <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-dark-950 p-4 rounded-lg">
                                  <div><span className="text-gray-500 block">bKash Personal:</span><span className="text-white font-bold">{config.payment.bkashPersonal}</span></div>
                                  <div><span className="text-gray-500 block">Nagad Personal:</span><span className="text-white font-bold">{config.payment.nagadPersonal}</span></div>
                              </div>
                              <input type="text" placeholder="Enter Transaction ID (TrxID)" className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none" required={paymentMethod === 'manual'} value={trxId} onChange={(e) => setTrxId(e.target.value)} />
                              <input type="text" placeholder="Your bKash/Nagad Number" className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none" required={paymentMethod === 'manual'} value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} />
                          </div>
                      )}
                  </div>
                  <button disabled={loading} type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-black uppercase italic tracking-wider py-4 rounded-xl shadow-glow transition-all">
                    {loading ? 'Processing...' : (paymentMethod === 'uddoktapay' ? `Pay ৳${cartTotal.toFixed(0)} Now` : `Verify Payment ৳${cartTotal.toFixed(0)}`)}
                  </button>
              </form>
          </div>
      )}
    </div>
  );
};
