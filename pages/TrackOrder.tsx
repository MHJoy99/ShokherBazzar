
import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Order } from '../types';
import { Helmet } from 'react-helmet-async';
import { config } from '../config';
import { useToast } from '../context/ToastContext';
import { useSearchParams } from 'react-router-dom';

export const TrackOrder: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [orderId, setOrderId] = useState('');
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const { showToast } = useToast();

    // AUTO-TRACK IF URL PARAMS EXIST
    useEffect(() => {
        const oid = searchParams.get('order_id');
        const em = searchParams.get('email');
        const tk = searchParams.get('token');
        
        if (oid && em) {
            setOrderId(oid);
            setEmail(em);
            if (tk) setToken(tk);
            
            // Auto trigger tracking if all data is present
            if(tk) {
                // We need a small delay to ensure state is set or just call directly
                api.trackOrder(oid, em, tk).then(res => {
                    if (res.type === 'success' && res.data) {
                        setOrder(res.data);
                    } else if (res.type === 'error') {
                        setError("Invalid tracking link or expired token.");
                    }
                });
            }
        }
    }, [searchParams]);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setOrder(null);
        setEmailSent(false);
        
        try {
            // Pass token if we have it (e.g. from URL)
            const result = await api.trackOrder(orderId, email, token);
            
            if (result.type === 'success' && result.data) {
                setOrder(result.data);
            } else if (result.type === 'email_sent') {
                setEmailSent(true);
            } else {
                setError("Order not found or access denied.");
            }
        } catch (err) {
            setError("Failed to track order. Please check your details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center">
            <Helmet><title>Track Order | {config.siteName}</title></Helmet>
            
            <div className="w-full max-w-3xl">
                {!order ? (
                    <div className="bg-dark-900 border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden max-w-md mx-auto">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                        <h2 className="text-3xl font-black text-white uppercase italic text-center mb-2">Track Order</h2>
                        <p className="text-gray-400 text-sm text-center mb-8">Enter your Order ID and Billing Email to retrieve your codes.</p>
                        
                        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded mb-6 text-xs font-bold text-center">{error}</div>}

                        {emailSent ? (
                            <div className="text-center py-8 animate-fade-in-up">
                                <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                    <i className="fas fa-envelope-open-text"></i>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Check Your Email</h3>
                                <p className="text-gray-400 text-sm mb-6">
                                    For security, we've sent a magic link to <b>{email}</b>. 
                                    Click the link in the email to view your keys.
                                </p>
                                <button onClick={() => setEmailSent(false)} className="text-primary text-xs font-bold uppercase hover:underline">Try Different Email</button>
                            </div>
                        ) : (
                            <form onSubmit={handleTrack} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Order ID</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={orderId} 
                                        onChange={(e) => setOrderId(e.target.value)} 
                                        placeholder="e.g. 9290" 
                                        className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none font-mono" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Billing Email</label>
                                    <input 
                                        type="email" 
                                        required 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        placeholder="email@example.com" 
                                        className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" 
                                    />
                                </div>
                                <button disabled={loading} type="submit" className="w-full bg-primary hover:bg-cyan-400 text-black font-black uppercase py-4 rounded-xl shadow-glow transition-all">
                                    {loading ? 'Searching...' : 'Track Order'}
                                </button>
                            </form>
                        )}
                    </div>
                ) : (
                    <div className="bg-dark-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
                        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase italic">Order #{order.id}</h2>
                                <p className="text-gray-400 text-sm">{order.date_created}</p>
                            </div>
                            <button onClick={() => setOrder(null)} className="text-sm font-bold text-gray-500 hover:text-white uppercase tracking-wider">Search Again</button>
                        </div>

                        <div className="space-y-6">
                            {order.line_items.map((item: any, idx: number) => (
                                <div key={idx} className="bg-dark-950 border border-white/10 rounded-xl p-6">
                                    <div className="flex gap-6 items-start">
                                        <div className="w-16 h-20 bg-dark-900 rounded border border-white/5 shrink-0 overflow-hidden">
                                            <img src={item.image} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-bold uppercase text-sm mb-2">{item.name} <span className="text-gray-500">x{item.quantity}</span></h3>
                                            
                                            {item.license_key ? (
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">License Key</p>
                                                    <div className="bg-black/50 p-3 rounded-lg border border-primary/30 flex items-start justify-between font-mono text-primary tracking-widest">
                                                        <span className="text-sm select-all break-all">{item.license_key}</span>
                                                        <button 
                                                            onClick={() => { navigator.clipboard.writeText(item.license_key || ''); showToast("Copied!", "success"); }} 
                                                            className="text-gray-400 hover:text-white ml-4"
                                                        >
                                                            <i className="fas fa-copy"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-3 rounded text-xs font-bold">
                                                    Status: {order.status.toUpperCase()} - Key not yet available.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
