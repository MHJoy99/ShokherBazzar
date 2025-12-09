
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Order } from '../types';
import { Helmet } from 'react-helmet-async';
import { config } from '../config';

export const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await login(email);
        setIsSubmitting(false);
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center pt-20 pb-20 px-4">
            <div className="bg-dark-900 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-600"></div>
                <div className="text-center mb-8"><h2 className="text-3xl font-black text-white uppercase italic">Welcome Back</h2><p className="text-gray-400 text-sm mt-2">Access your digital vault.</p></div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div><label className="block text-xs font-bold uppercase text-gray-500 mb-2">Email Address</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" placeholder="user@example.com" /></div>
                    <div><label className="block text-xs font-bold uppercase text-gray-500 mb-2">Password</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" placeholder="••••••••" /></div>
                    <button disabled={isSubmitting} type="submit" className="w-full bg-primary hover:bg-cyan-400 text-black font-black uppercase py-4 rounded-xl shadow-glow transition-all">{isSubmitting ? 'Accessing Vault...' : 'Login'}</button>
                </form>
                <div className="mt-6 text-center"><p className="text-xs text-gray-500">Don't have an account? <span className="text-primary cursor-pointer hover:underline">Register</span></p></div>
            </div>
        </div>
    );
};

export const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'orders' | 'keys' | 'profile'>('orders');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        const fetchOrders = async () => { const data = await api.getUserOrders(user.id); setOrders(data); setLoading(false); };
        fetchOrders();
    }, [user, navigate]);

    if (!user) return null;

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
            <Helmet><title>My Dashboard | {config.siteName}</title></Helmet>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-dark-900 border border-white/10 rounded-2xl p-6 text-center sticky top-24">
                        <div className="w-24 h-24 rounded-full border-2 border-primary mx-auto mb-4 p-1"><img src={user.avatar_url} className="w-full h-full rounded-full object-cover" alt="Avatar" /></div>
                        <h2 className="text-xl font-bold text-white uppercase">{user.username}</h2>
                        <p className="text-gray-500 text-xs mb-6">{user.email}</p>
                        <div className="space-y-2">
                            <button onClick={() => setActiveTab('orders')} className={`w-full text-left p-3 rounded-lg text-sm font-bold uppercase transition-all flex items-center gap-3 ${activeTab === 'orders' ? 'bg-primary text-black' : 'hover:bg-white/5 text-gray-400'}`}><i className="fas fa-shopping-bag"></i> My Orders</button>
                            <button onClick={() => setActiveTab('keys')} className={`w-full text-left p-3 rounded-lg text-sm font-bold uppercase transition-all flex items-center gap-3 ${activeTab === 'keys' ? 'bg-primary text-black' : 'hover:bg-white/5 text-gray-400'}`}><i className="fas fa-key"></i> My Licenses</button>
                            <button onClick={() => setActiveTab('profile')} className={`w-full text-left p-3 rounded-lg text-sm font-bold uppercase transition-all flex items-center gap-3 ${activeTab === 'profile' ? 'bg-primary text-black' : 'hover:bg-white/5 text-gray-400'}`}><i className="fas fa-user-cog"></i> Profile</button>
                            <button onClick={logout} className="w-full text-left p-3 rounded-lg text-sm font-bold uppercase transition-all flex items-center gap-3 hover:bg-red-500/20 text-red-500 mt-4"><i className="fas fa-sign-out-alt"></i> Logout</button>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-3">
                    <h1 className="text-3xl font-black text-white uppercase italic mb-8 border-l-4 border-primary pl-4">{activeTab === 'orders' ? 'Order History' : activeTab === 'keys' ? 'Digital Vault' : 'Profile Settings'}</h1>
                    {loading ? (<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>) : (
                        <div className="space-y-6">
                            {activeTab === 'orders' && orders.map(order => (
                                <div key={order.id} className="bg-dark-900 border border-white/5 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-white/20 transition-colors">
                                    <div className="flex items-center gap-4"><div className="w-12 h-12 bg-dark-950 rounded flex items-center justify-center text-gray-500 border border-white/10 font-mono text-xs">#{order.id}</div><div><p className="text-white font-bold text-sm">{order.line_items[0].name} {order.line_items.length > 1 && `+ ${order.line_items.length - 1} more`}</p><p className="text-gray-500 text-xs">{order.date_created}</p></div></div>
                                    <div className="text-right"><p className="text-primary font-bold">৳{order.total}</p><span className="inline-block px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase rounded mt-1 border border-green-500/20">{order.status}</span></div>
                                </div>
                            ))}
                            {activeTab === 'keys' && (
                                <div className="grid grid-cols-1 gap-6">
                                    {orders.flatMap(o => o.line_items).filter(item => item.license_key).map((item, idx) => (
                                        <div key={idx} className="bg-gradient-to-r from-dark-900 to-dark-950 border border-primary/30 p-6 rounded-xl relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all"></div>
                                            <div className="flex gap-6 items-start"><img src={item.image} className="w-16 h-20 object-cover rounded shadow-lg border border-white/10" alt="" /><div className="flex-1"><h3 className="text-white font-bold uppercase">{item.name}</h3><p className="text-gray-400 text-xs mb-4">Ready to Redeem</p><div className="bg-black/50 p-3 rounded-lg border border-primary/30 flex items-center justify-between font-mono text-primary tracking-widest relative"><span>{item.license_key}</span><button onClick={() => { navigator.clipboard.writeText(item.license_key || ''); alert('Copied!'); }} className="text-gray-400 hover:text-white transition-colors"><i className="fas fa-copy"></i></button></div></div></div>
                                        </div>
                                    ))}
                                    {orders.every(o => !o.line_items.some(i => i.license_key)) && <p className="text-gray-500 text-center py-10">No active licenses found.</p>}
                                </div>
                            )}
                            {activeTab === 'profile' && (<div className="bg-dark-900 p-8 rounded-xl border border-white/10 text-center"><p className="text-gray-400">Profile editing is disabled in this demo.</p></div>)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
