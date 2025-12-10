
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Order, OrderNote } from '../types';
import { Helmet } from 'react-helmet-async';
import { config } from '../config';

export const LoginPage: React.FC = () => {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [isRegistering, setIsRegistering] = useState(false);
    
    // Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Register State
    const [regData, setRegData] = useState({ email: '', password: '', first_name: '', last_name: '' });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || "Login failed. Check your credentials.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await register(regData);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || "Registration failed. Email might be taken.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center pt-32 pb-20 px-4">
            <div className="bg-dark-900 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-600"></div>
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-white uppercase italic">{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
                    <p className="text-gray-400 text-sm mt-2">{isRegistering ? 'Join the community.' : 'Access your digital vault.'}</p>
                </div>
                
                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded mb-4 text-xs font-bold text-center">{error}</div>}

                {isRegistering ? (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <div><label className="block text-xs font-bold uppercase text-gray-500 mb-2">First Name</label><input type="text" required value={regData.first_name} onChange={(e) => setRegData({...regData, first_name: e.target.value})} className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" /></div>
                             <div><label className="block text-xs font-bold uppercase text-gray-500 mb-2">Last Name</label><input type="text" required value={regData.last_name} onChange={(e) => setRegData({...regData, last_name: e.target.value})} className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" /></div>
                        </div>
                        <div><label className="block text-xs font-bold uppercase text-gray-500 mb-2">Email</label><input type="email" required value={regData.email} onChange={(e) => setRegData({...regData, email: e.target.value})} className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" /></div>
                        <div><label className="block text-xs font-bold uppercase text-gray-500 mb-2">Password</label><input type="password" required value={regData.password} onChange={(e) => setRegData({...regData, password: e.target.value})} className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" /></div>
                        <button disabled={isSubmitting} type="submit" className="w-full bg-primary hover:bg-cyan-400 text-black font-black uppercase py-4 rounded-xl shadow-glow transition-all">{isSubmitting ? 'Creating...' : 'Register'}</button>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div><label className="block text-xs font-bold uppercase text-gray-500 mb-2">Email Address</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" placeholder="user@example.com" /></div>
                        <div><label className="block text-xs font-bold uppercase text-gray-500 mb-2">Password</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" placeholder="••••••••" /></div>
                        
                        <button disabled={isSubmitting} type="submit" className="w-full bg-primary hover:bg-cyan-400 text-black font-black uppercase py-4 rounded-xl shadow-glow transition-all">{isSubmitting ? 'Accessing Vault...' : 'Login'}</button>
                    </form>
                )}
                
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        {isRegistering ? "Already have an account?" : "Don't have an account?"} 
                        <span onClick={() => setIsRegistering(!isRegistering)} className="text-primary cursor-pointer hover:underline ml-1 font-bold">
                            {isRegistering ? 'Login' : 'Register'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- NEW COMPONENT FOR ORDER ROW EXPANSION ---
const OrderRow: React.FC<{ order: Order }> = ({ order }) => {
    const [expanded, setExpanded] = useState(false);
    const [notes, setNotes] = useState<OrderNote[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(false);

    const toggleExpand = async () => {
        if (!expanded && notes.length === 0) {
            setLoadingNotes(true);
            const fetchedNotes = await api.getOrderNotes(order.id);
            setNotes(fetchedNotes);
            setLoadingNotes(false);
        }
        setExpanded(!expanded);
    };

    return (
        <div className="bg-dark-900 border border-white/5 rounded-xl overflow-hidden transition-colors hover:border-white/20">
            {/* Main Row */}
            <div 
                onClick={toggleExpand}
                className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-dark-950 rounded flex items-center justify-center text-gray-500 border border-white/10 font-mono text-xs">
                        #{order.id}
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm">
                            {order.line_items[0]?.name || 'Unknown Item'} {order.line_items.length > 1 && `+ ${order.line_items.length - 1} more`}
                        </p>
                        <p className="text-gray-500 text-xs">{order.date_created}</p>
                    </div>
                </div>
                <div className="text-right flex items-center gap-4">
                    <div>
                        <p className="text-primary font-bold">৳{order.total}</p>
                        <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase rounded mt-1 border ${
                            order.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                            order.status === 'processing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>
                            {order.status}
                        </span>
                    </div>
                    <i className={`fas fa-chevron-down text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}></i>
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="bg-dark-950/50 p-6 border-t border-white/5 text-sm space-y-6 animate-fade-in-up">
                    
                    {/* 1. Admin Notes (The requested fix) */}
                    <div>
                        <h4 className="text-gray-400 font-bold uppercase text-xs mb-3">Messages from Support</h4>
                        {loadingNotes ? (
                            <p className="text-gray-600 italic">Checking for messages...</p>
                        ) : notes.length > 0 ? (
                            <div className="space-y-3">
                                {notes.map(note => (
                                    <div key={note.id} className="bg-blue-500/10 border-l-4 border-blue-500 p-3 rounded-r">
                                        <p className="text-gray-300">{note.note}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">{note.date_created}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600">No new messages.</p>
                        )}
                    </div>

                    {/* 2. Downloadable Files (The fundamental fix) */}
                    {order.line_items.some(i => i.downloads && i.downloads.length > 0) && (
                        <div>
                            <h4 className="text-gray-400 font-bold uppercase text-xs mb-3">Downloadable Files</h4>
                            <div className="space-y-2">
                                {order.line_items.map(item => (
                                    item.downloads?.map(file => (
                                        <div key={file.id} className="flex items-center justify-between bg-dark-900 p-3 rounded border border-white/10">
                                            <span className="text-white font-bold">{file.name}</span>
                                            <a 
                                                href={file.download_url} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="bg-primary text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-cyan-400"
                                            >
                                                Download
                                            </a>
                                        </div>
                                    ))
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. Items Table */}
                    <div>
                         <h4 className="text-gray-400 font-bold uppercase text-xs mb-3">Order Items</h4>
                         {order.line_items.map((item, idx) => (
                             <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                 <span className="text-gray-300">{item.name} x{item.quantity}</span>
                                 {/* Show key immediately if present here */}
                                 {item.license_key && (
                                     <span className="font-mono text-primary bg-primary/10 px-2 py-1 rounded select-all">
                                         {item.license_key}
                                     </span>
                                 )}
                             </div>
                         ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'orders' | 'keys' | 'profile'>('orders');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [announcement, setAnnouncement] = useState<{title: string, content: string} | null>(null);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        const fetchOrders = async () => { 
            const data = await api.getUserOrders(user.id); 
            setOrders(data); 
            setLoading(false); 
        };
        const fetchNotice = async () => {
            const notice = await api.getPage('dashboard-notice');
            if (notice) setAnnouncement(notice);
        };
        fetchOrders();
        fetchNotice();
    }, [user, navigate]);

    if (!user) return null;

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
            <Helmet><title>My Dashboard | {config.siteName}</title></Helmet>
            
            {announcement && (
                <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl mb-8 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                        <i className="fas fa-bullhorn"></i>
                    </div>
                    <div>
                        <h3 className="text-blue-400 font-bold uppercase mb-2">{announcement.title}</h3>
                        <div className="text-gray-300 text-sm prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: announcement.content }} />
                    </div>
                </div>
            )}

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
                            {/* NEW ORDER ROW COMPONENT IMPLEMENTATION */}
                            {activeTab === 'orders' && orders.map(order => (
                                <OrderRow key={order.id} order={order} />
                            ))}
                            {activeTab === 'orders' && orders.length === 0 && <p className="text-gray-500 text-center py-10">No orders found.</p>}
                            
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
                            {activeTab === 'profile' && (<div className="bg-dark-900 p-8 rounded-xl border border-white/10 text-center"><p className="text-gray-400">Profile editing is disabled in this version.</p></div>)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
