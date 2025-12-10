
import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Order } from '../types';
import { Helmet } from 'react-helmet-async';
import { config } from '../config';
import { useToast } from '../context/ToastContext';
import { useSearchParams, Link } from 'react-router-dom';

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
            
            if(tk) {
                setLoading(true);
                api.trackOrder(oid, em, tk).then(res => {
                    setLoading(false);
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
            
            <div className="w-full max-w-4xl">
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
                    <div className="space-y-8 animate-fade-in-up">
                        {/* ORDER HEADER */}
                        <div className="bg-dark-900 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-dark-950 rounded-xl flex items-center justify-center text-gray-500 border border-white/5 font-mono text-xl shadow-inner">
                                    #{order.id}
                                </div>
                                <div>
                                    <h2 className="text-white font-bold text-lg">Order Details</h2>
                                    <p className="text-gray-400 text-sm">{order.date_created}</p>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-6">
                                <div>
                                    <p className="text-gray-500 text-xs font-bold uppercase">Total</p>
                                    <p className="text-2xl font-black text-primary">৳{order.total}</p>
                                </div>
                                <div className={`px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-wider border ${
                                    order.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                    order.status === 'processing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                }`}>
                                    {order.status}
                                </div>
                            </div>
                        </div>

                        {/* DIGITAL VAULT (ITEMS) */}
                        <div className="grid grid-cols-1 gap-6">
                            {order.line_items.map((item, idx) => {
                                const keyStr = item.license_key || '';
                                const isEncrypted = keyStr.startsWith('def50'); 
                                const isError = keyStr.startsWith('Error:');

                                return (
                                    <div key={idx} className="bg-gradient-to-r from-dark-900 to-dark-950 border border-primary/30 p-6 rounded-xl relative overflow-hidden group shadow-lg">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
                                        
                                        <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
                                            <div className="w-20 h-28 bg-dark-950 rounded-lg border border-white/10 shrink-0 overflow-hidden shadow-lg">
                                                <img src={item.image} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            
                                            <div className="flex-1 w-full">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="text-white font-bold uppercase text-lg">{item.name}</h3>
                                                    <span className="bg-white/5 text-gray-400 text-xs font-bold px-2 py-1 rounded">x{item.quantity}</span>
                                                </div>
                                                
                                                {/* LICENSE KEY SECTION */}
                                                {keyStr ? (
                                                    <div className="space-y-2">
                                                        <p className="text-xs text-primary font-bold uppercase tracking-widest flex items-center gap-2">
                                                            <i className="fas fa-key"></i> License Key
                                                        </p>
                                                        
                                                        {isEncrypted || isError ? (
                                                            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <i className="fas fa-exclamation-triangle text-red-500"></i>
                                                                    <span className="text-red-400 font-bold text-xs uppercase">
                                                                        {isError ? keyStr.replace('Error: ', '') : 'Processing...'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-500 text-[10px]">Contact support if this persists.</p>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-black/40 p-4 rounded-lg border border-primary/20 flex items-center justify-between font-mono text-white tracking-widest shadow-inner group-hover:border-primary/40 transition-colors">
                                                                <span className="text-sm md:text-base select-all break-all text-primary">{keyStr}</span>
                                                                <button 
                                                                    onClick={() => { 
                                                                        navigator.clipboard.writeText(keyStr); 
                                                                        showToast("Copied!", "success");
                                                                    }} 
                                                                    className="text-gray-500 hover:text-white ml-4 p-2 hover:bg-white/10 rounded transition-all"
                                                                    title="Copy Code"
                                                                >
                                                                    <i className="fas fa-copy"></i>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-lg text-sm font-bold flex items-center gap-3">
                                                        <i className="fas fa-clock text-xl"></i>
                                                        <div>
                                                            <p>Processing Order</p>
                                                            <p className="text-[10px] font-normal text-yellow-200/70">Your key will appear here automatically once payment is confirmed.</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* DOWNLOADS */}
                                                {item.downloads && item.downloads.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-white/5">
                                                        <p className="text-xs text-gray-400 font-bold uppercase mb-2">Downloads</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {item.downloads.map(file => (
                                                                <a 
                                                                    key={file.id}
                                                                    href={file.download_url} 
                                                                    target="_blank" 
                                                                    rel="noreferrer"
                                                                    className="bg-dark-800 hover:bg-primary hover:text-black text-white text-xs font-bold px-4 py-2 rounded-lg border border-white/10 transition-all flex items-center gap-2"
                                                                >
                                                                    <i className="fas fa-download"></i> {file.name}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="text-center pt-8">
                            <button onClick={() => setOrder(null)} className="text-gray-500 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors">
                                <i className="fas fa-arrow-left mr-2"></i> Track Another Order
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
