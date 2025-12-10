
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Product } from '../types';

export const Navbar: React.FC = () => {
  const { itemCount } = useCart();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Search Logic with Debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
        if (searchQuery.length < 2) { setSearchResults([]); return; }
        // Performance: In a real app, you'd search via API endpoint like /products?search=...
        // For now, we fetch all (cached usually by browser) and filter locally
        const all = await api.getProducts('all');
        const filtered = all.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
        setSearchResults(filtered);
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle "Enter" key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          if (searchResults.length > 0) {
              // Navigate to the first result
              handleNavigate(searchResults[0].slug);
          }
      }
  };

  const handleNavigate = (slug: string) => {
      setSearchResults([]); 
      setSearchQuery(''); 
      setIsMobileSearchOpen(false); 
      navigate(`/product/${slug}`);
  };

  // Close search results when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
              setSearchResults([]);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
      { 
          title: "Gift Cards", 
          slug: "gift-cards",
          sub: [
              { name: "Steam Wallet", icon: "fab fa-steam", link: "/category/steam" },
              { name: "Google Play", icon: "fab fa-google-play", link: "/category/google-play" },
              { name: "Xbox Live", icon: "fab fa-xbox", link: "/category/xbox" },
              { name: "PlayStation", icon: "fab fa-playstation", link: "/category/psn" },
              { name: "iTunes", icon: "fab fa-apple", link: "/category/itunes" },
          ]
      },
      { 
          title: "Games", 
          slug: "games",
          sub: [
              { name: "Action", icon: "fas fa-fist-raised", link: "/category/action" },
              { name: "RPG", icon: "fas fa-magic", link: "/category/rpg" },
              { name: "Strategy", icon: "fas fa-chess", link: "/category/strategy" },
              { name: "Sports", icon: "fas fa-futbol", link: "/category/sports" },
              { name: "Simulation", icon: "fas fa-plane", link: "/category/simulation" },
          ]
      },
      { 
          title: "Accounts", 
          slug: "accounts",
          sub: [
              { name: "Steam Accounts", icon: "fab fa-steam-symbol", link: "/category/steam-accounts" },
              { name: "Valorant", icon: "fas fa-crosshairs", link: "/category/valorant" },
              { name: "Fortnite", icon: "fas fa-shield-alt", link: "/category/fortnite" },
              { name: "Netflix", icon: "fas fa-tv", link: "/category/netflix" },
          ]
      }
  ];

  return (
    <>
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white text-[10px] md:text-xs font-bold py-2 text-center fixed top-0 w-full z-[60] tracking-widest uppercase">
        🚀 Instant Delivery 24/7 • 🇧🇩 Official BD Reseller • 💎 100% Secure
      </div>
      
      <nav className="fixed top-[32px] left-0 w-full z-50 glass border-b border-white/5 h-20 flex items-center shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 w-full flex justify-between gap-4 items-center">
           
           {/* LOGO */}
           <Link to="/" className="flex items-center gap-2 group z-50 shrink-0">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-glow">
                <i className="fas fa-gamepad text-black text-2xl"></i>
              </div>
              <div className="hidden sm:block">
                  <h1 className="text-xl font-black text-white italic tracking-tighter leading-none">MHJOY<span className="text-primary">GAMERSHUB</span></h1>
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest">Digital Store</p>
              </div>
           </Link>
           
           {/* DESKTOP NAV LINKS */}
           <div className="hidden lg:flex items-center gap-6 h-full">
               {navLinks.map((nav) => (
                   <div 
                      key={nav.title}
                      className="relative h-full flex items-center"
                      onMouseEnter={() => setHoveredNav(nav.title)}
                      onMouseLeave={() => setHoveredNav(null)}
                   >
                       <Link 
                          to={`/category/${nav.slug}`} 
                          className={`text-sm font-bold uppercase tracking-wide transition-colors flex items-center gap-1 ${hoveredNav === nav.title ? 'text-primary' : 'text-gray-300'}`}
                        >
                           {nav.title} <i className={`fas fa-chevron-down text-[10px] transition-transform ${hoveredNav === nav.title ? 'rotate-180' : ''}`}></i>
                       </Link>
                       <AnimatePresence>
                           {hoveredNav === nav.title && (
                               <motion.div
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                  transition={{ duration: 0.2 }}
                                  className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-64"
                               >
                                   <div className="bg-dark-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden p-2 backdrop-blur-xl relative">
                                       <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                                       {nav.sub.map((item) => (
                                           <Link 
                                              key={item.name} 
                                              to={item.link} 
                                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-all group"
                                           >
                                               <div className="w-8 h-8 rounded-full bg-dark-950 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                   <i className={item.icon}></i>
                                               </div>
                                               <span className="text-sm font-bold">{item.name}</span>
                                           </Link>
                                       ))}
                                   </div>
                               </motion.div>
                           )}
                       </AnimatePresence>
                   </div>
               ))}
               <Link to="/contact" className="text-sm font-bold text-gray-300 hover:text-white hover:text-primary transition-colors uppercase tracking-wide">Support</Link>
           </div>

           {/* DESKTOP SEARCH BAR */}
           <div className="hidden lg:block relative flex-1 max-w-md mx-4" ref={searchContainerRef}>
              <div className="relative group">
                  <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    onKeyDown={handleKeyDown}
                    placeholder="Search..." 
                    className="w-full bg-dark-950/50 backdrop-blur rounded-xl px-5 py-3 pl-12 text-white border border-white/10 focus:border-primary outline-none transition-all focus:bg-dark-900 text-sm" 
                  />
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors"></i>
              </div>
              <AnimatePresence>
              {searchResults.length > 0 && searchQuery && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-full bg-dark-900 border border-white/10 rounded-xl mt-3 overflow-hidden shadow-2xl z-50"
                  >
                      {searchResults.map(p => (
                          <Link 
                            to={`/product/${p.slug}`}
                            key={p.id} 
                            onClick={() => handleNavigate(p.slug)} 
                            className="p-3 hover:bg-white/5 cursor-pointer flex gap-4 text-white border-b border-white/5 last:border-0 group"
                          >
                             <img src={p.images[0].src} className="w-12 h-12 rounded-lg object-cover" alt="" />
                             <div className="flex flex-col justify-center">
                                 <p className="text-sm font-bold group-hover:text-primary transition-colors">{p.name}</p>
                                 <p className="text-xs text-gray-400">From <span className="text-white font-bold">৳{p.price}</span></p>
                             </div>
                          </Link>
                      ))}
                  </motion.div>
              )}
              </AnimatePresence>
           </div>

           {/* ACTIONS (Cart, User, Mobile Toggles) */}
           <div className="flex items-center gap-3 z-50">
              {/* MOBILE SEARCH TOGGLE */}
              <button 
                  onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                  className="w-10 h-10 rounded-full bg-white/5 flex lg:hidden items-center justify-center text-white active:scale-95 transition-transform"
              >
                  <i className={`fas ${isMobileSearchOpen ? 'fa-times' : 'fa-search'}`}></i>
              </button>

              <Link to="/cart" className="relative group">
                 <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
                    <i className="fas fa-shopping-cart text-sm"></i>
                 </div>
                 {itemCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-dark-900 shadow-glow">{itemCount}</span>}
              </Link>
              
              {user ? (
                   <Link to="/dashboard" className="hidden sm:flex items-center gap-2 bg-white/5 rounded-full pl-1 pr-3 py-1 hover:bg-white/10 transition-colors border border-white/10">
                        <img src={user.avatar_url} className="w-8 h-8 rounded-full border border-primary" alt="User" />
                        <span className="hidden md:block text-xs font-bold text-white uppercase">{user.username}</span>
                   </Link>
              ) : (
                  <Link to="/login" className="hidden sm:flex w-10 h-10 rounded-full bg-white/5 items-center justify-center hover:bg-white/10 transition-colors">
                      <i className="fas fa-user text-sm"></i>
                  </Link>
              )}

              {/* MOBILE MENU TOGGLE */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-10 h-10 rounded-full bg-white/5 flex lg:hidden items-center justify-center text-white active:scale-95 transition-transform"
              >
                  <i className="fas fa-bars"></i>
              </button>
           </div>
        </div>
        
        {/* MOBILE SEARCH BAR DROPDOWN */}
        <AnimatePresence>
            {isMobileSearchOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="absolute top-full left-0 w-full bg-dark-950 border-b border-white/10 z-40 overflow-visible shadow-2xl"
                >
                    <div className="p-4 relative">
                        <div className="relative">
                            <input 
                                autoFocus
                                type="text" 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                                onKeyDown={handleKeyDown}
                                placeholder="Search products..." 
                                className="w-full bg-dark-900 border border-white/10 rounded-xl px-5 py-3 pl-12 text-white focus:border-primary outline-none" 
                            />
                            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                            {searchResults.length > 0 && (
                                <button onClick={() => handleNavigate(searchResults[0].slug)} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-bold text-xs uppercase bg-white/10 px-2 py-1 rounded">
                                    GO <i className="fas fa-arrow-right ml-1"></i>
                                </button>
                            )}
                        </div>
                        
                        {/* MOBILE SEARCH RESULTS */}
                        {searchResults.length > 0 && searchQuery && (
                            <div className="mt-4 bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-[60vh] overflow-y-auto">
                                {searchResults.map(p => (
                                    <Link 
                                        to={`/product/${p.slug}`}
                                        key={p.id} 
                                        onClick={() => handleNavigate(p.slug)} 
                                        className="p-3 border-b border-white/5 flex gap-4 text-white active:bg-white/10"
                                    >
                                        <img src={p.images[0].src} className="w-12 h-12 rounded object-cover" alt="" />
                                        <div>
                                            <p className="text-sm font-bold">{p.name}</p>
                                            <p className="text-xs text-primary font-bold">৳{p.price}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </nav>

      {/* MOBILE SIDEBAR MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <motion.div
               initial={{ opacity: 0, x: '100%' }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: '100%' }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="fixed inset-0 z-[100] bg-dark-950 flex flex-col h-full lg:hidden"
            >
                {/* MENU HEADER WITH CLOSE BUTTON */}
                <div className="p-6 flex items-center justify-between border-b border-white/5 bg-dark-900">
                    <h2 className="text-xl font-black text-white italic tracking-tighter">MENU</h2>
                    <button 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white active:bg-red-500 active:text-white transition-colors"
                    >
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-col gap-6">
                        
                        {/* User Status in Menu */}
                        {user ? (
                            <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="bg-primary/10 border border-primary/30 p-4 rounded-xl flex items-center gap-4 mb-2">
                                <img src={user.avatar_url} className="w-12 h-12 rounded-full border border-primary" alt="" />
                                <div>
                                    <p className="text-gray-400 text-xs font-bold uppercase">Logged in as</p>
                                    <p className="text-white font-black uppercase text-lg">{user.username}</p>
                                </div>
                            </Link>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 mb-2">
                                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="bg-white/5 border border-white/10 p-3 rounded-xl text-center font-bold text-white uppercase">Login</Link>
                                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="bg-primary text-black p-3 rounded-xl text-center font-black uppercase">Register</Link>
                            </div>
                        )}

                        {navLinks.map((nav) => (
                            <div key={nav.title} className="space-y-4">
                                <h3 className="text-primary font-black uppercase tracking-widest text-sm border-b border-white/10 pb-2">{nav.title}</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {nav.sub.map((item) => (
                                        <Link key={item.name} to={item.link} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 bg-dark-900 p-3 rounded-lg border border-white/5 active:bg-white/10 active:border-primary/50">
                                            <div className="w-8 h-8 rounded bg-dark-950 flex items-center justify-center text-gray-400">
                                                <i className={`${item.icon}`}></i>
                                            </div>
                                            <span className="text-sm font-bold text-white">{item.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                        
                        <div className="pt-4 border-t border-white/10">
                            <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="block bg-white/5 p-4 rounded-xl text-center font-bold text-white uppercase border border-white/10">Contact Support</Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
      <div className="h-[32px]"></div> 
    </>
  );
};
