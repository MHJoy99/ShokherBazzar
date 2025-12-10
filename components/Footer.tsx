
import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => (
  <footer className="bg-dark-950 border-t border-white/5 pt-16 mt-auto relative overflow-hidden">
     <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
     <div className="max-w-7xl mx-auto px-4 relative z-10">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
                <Link to="/" className="flex items-center gap-2">
                    <i className="fas fa-gamepad text-primary text-3xl"></i>
                    <span className="text-2xl font-black text-white italic tracking-tighter">MHJOY<span className="text-primary">GAMERSHUB</span></span>
                </Link>
                <p className="text-gray-400 text-sm leading-relaxed">
                    Bangladesh's most trusted digital marketplace for gamers. 
                    Official reseller of Steam Wallet, Google Play, Free Fire, and more.
                </p>
                <div className="flex gap-4">
                    <a href="#" className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all"><i className="fab fa-facebook-f"></i></a>
                    <a href="#" className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center text-gray-400 hover:bg-indigo-500 hover:text-white transition-all"><i className="fab fa-discord"></i></a>
                    <a href="#" className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition-all"><i className="fab fa-instagram"></i></a>
                </div>
            </div>
            <div>
               <h4 className="text-white font-bold uppercase tracking-widest mb-6 border-l-2 border-primary pl-3">My Account</h4>
               <ul className="space-y-3 text-sm text-gray-400">
                  <li><Link to="/cart" className="hover:text-primary transition-colors">My Cart</Link></li>
                  <li><Link to="/track-order" className="hover:text-primary transition-colors font-bold text-white">Track Guest Order</Link></li>
                  <li><Link to="/dashboard" className="hover:text-primary transition-colors">My Codes</Link></li>
                  <li><Link to="/login" className="hover:text-primary transition-colors">Login / Register</Link></li>
               </ul>
            </div>
            <div>
               <h4 className="text-white font-bold uppercase tracking-widest mb-6 border-l-2 border-primary pl-3">Help Center</h4>
               <ul className="space-y-3 text-sm text-gray-400">
                  <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                  <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Support</Link></li>
                  <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                  <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/refund" className="hover:text-primary transition-colors">Refund Policy</Link></li>
               </ul>
            </div>
            <div>
               <h4 className="text-white font-bold uppercase tracking-widest mb-6 border-l-2 border-primary pl-3">Secure Payment</h4>
               <p className="text-xs text-gray-500 mb-4">We accept 100% secure local payments.</p>
               <div className="grid grid-cols-3 gap-2">
                   <div className="bg-pink-600 rounded p-2 flex items-center justify-center h-10" title="bKash"><span className="font-bold text-white text-[10px]">bKash</span></div>
                   <div className="bg-orange-600 rounded p-2 flex items-center justify-center h-10" title="Nagad"><span className="font-bold text-white text-[10px]">Nagad</span></div>
                   <div className="bg-purple-600 rounded p-2 flex items-center justify-center h-10" title="Rocket"><span className="font-bold text-white text-[10px]">Rocket</span></div>
                   <div className="bg-blue-800 rounded p-2 flex items-center justify-center h-10" title="Visa"><i className="fab fa-cc-visa text-white text-lg"></i></div>
                   <div className="bg-red-800 rounded p-2 flex items-center justify-center h-10" title="Mastercard"><i className="fab fa-cc-mastercard text-white text-lg"></i></div>
               </div>
            </div>
         </div>
         <div className="border-t border-white/5 pt-8 pb-8 flex flex-col md:flex-row items-center justify-between gap-4">
             <p className="text-gray-600 text-xs">
                 &copy; 2024 MHJoyGamersHub. All trademarks are property of their respective owners.
             </p>
             <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                 <span className="text-gray-500 text-xs font-bold uppercase">All Systems Operational</span>
             </div>
         </div>
     </div>
  </footer>
);
