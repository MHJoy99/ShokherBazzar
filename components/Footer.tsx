
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const { showToast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
      e.preventDefault();
      if(email) {
          showToast("Thanks for subscribing!", "success");
          setEmail('');
      }
  };

  return (
    <footer className="bg-dark-950 border-t border-white/5 pt-20 mt-auto relative overflow-hidden font-sans">
       {/* Decorative Background Elements */}
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
       <div className="absolute -top-[300px] -right-[300px] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
       
       <div className="max-w-7xl mx-auto px-4 relative z-10">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
              
              {/* BRAND COLUMN */}
              <div className="space-y-6">
                  <Link to="/" className="flex items-center gap-2 group/logo">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center transform group-hover/logo:rotate-12 transition-transform shadow-glow">
                          <i className="fas fa-gamepad text-black text-2xl"></i>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-xl font-black text-white italic tracking-tighter leading-none">MHJOY<span className="text-primary">GAMERSHUB</span></span>
                         <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Trusted Digital Store</span>
                      </div>
                  </Link>
                  <p className="text-gray-400 text-sm leading-relaxed border-l-2 border-white/10 pl-4">
                      Bangladesh's most trusted digital marketplace for gamers. Official reseller of Steam Wallet, Google Play, Free Fire, and more.
                  </p>
                  
                  {/* Social Links */}
                  <div className="flex gap-3 pt-2">
                      <a href="https://facebook.com/mhjoygamershub" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-dark-900 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all transform hover:-translate-y-1"><i className="fab fa-facebook-f"></i></a>
                      <a href="https://discord.gg/zfGgdv4cWu" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-dark-900 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#5865F2] hover:text-white hover:border-[#5865F2] transition-all transform hover:-translate-y-1"><i className="fab fa-discord"></i></a>
                      <a href="https://instagram.com/mhjoygamershub" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-dark-900 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#E4405F] hover:text-white hover:border-[#E4405F] transition-all transform hover:-translate-y-1"><i className="fab fa-instagram"></i></a>
                      <a href="https://wa.me/01983888331" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-dark-900 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all transform hover:-translate-y-1"><i className="fab fa-whatsapp"></i></a>
                  </div>
              </div>
  
              {/* MY ACCOUNT */}
              <div>
                 <h4 className="text-white font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-xs">
                     <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> My Account
                 </h4>
                 <ul className="space-y-3 text-sm text-gray-400">
                    <li><Link to="/cart" className="hover:text-primary hover:translate-x-1 transition-all inline-block">My Cart</Link></li>
                    <li><Link to="/track-order" className="hover:text-primary hover:translate-x-1 transition-all inline-block font-bold text-white relative">Track Guest Order <span className="absolute -right-2 top-0 w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span></Link></li>
                    <li><Link to="/dashboard" className="hover:text-primary hover:translate-x-1 transition-all inline-block">My Codes</Link></li>
                    <li><Link to="/login" className="hover:text-primary hover:translate-x-1 transition-all inline-block">Login / Register</Link></li>
                 </ul>
              </div>
  
              {/* HELP CENTER */}
              <div>
                 <h4 className="text-white font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-xs">
                     <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Help Center
                 </h4>
                 <ul className="space-y-3 text-sm text-gray-400">
                    <li><Link to="/about" className="hover:text-primary hover:translate-x-1 transition-all inline-block">About Us</Link></li>
                    <li><Link to="/contact" className="hover:text-primary hover:translate-x-1 transition-all inline-block">Contact Support</Link></li>
                    <li><Link to="/terms" className="hover:text-primary hover:translate-x-1 transition-all inline-block">Terms of Service</Link></li>
                    <li><Link to="/privacy" className="hover:text-primary hover:translate-x-1 transition-all inline-block">Privacy Policy</Link></li>
                    <li><Link to="/refund" className="hover:text-primary hover:translate-x-1 transition-all inline-block">Refund Policy</Link></li>
                 </ul>
              </div>
  
              {/* SECURE PAYMENT */}
              <div>
                 <h4 className="text-white font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-xs">
                     <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Secure Payment
                 </h4>
                 <p className="text-xs text-gray-500 mb-4">We accept 100% secure local payments.</p>
                 <div className="bg-dark-900 p-4 rounded-xl border border-white/5 mb-6 grid grid-cols-3 gap-2">
                      <img src="https://raw.githubusercontent.com/sh4hids/bangladesh-payment-gateway-logos/master/bkash/bkash-logo.png" className="h-8 bg-white rounded p-1 object-contain w-full" alt="bKash" />
                      <img src="https://raw.githubusercontent.com/sh4hids/bangladesh-payment-gateway-logos/master/nagad/nagad-logo.png" className="h-8 bg-white rounded p-1 object-contain w-full" alt="Nagad" />
                      <img src="https://raw.githubusercontent.com/sh4hids/bangladesh-payment-gateway-logos/master/rocket/rocket-logo.png" className="h-8 bg-white rounded p-1 object-contain w-full" alt="Rocket" />
                      <div className="bg-white rounded p-1 h-8 flex items-center justify-center"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" className="h-full object-contain" alt="Visa" /></div>
                      <div className="bg-white rounded p-1 h-8 flex items-center justify-center"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" className="h-full object-contain" alt="Mastercard" /></div>
                 </div>
                 
                 <form onSubmit={handleSubscribe} className="relative group">
                     <input 
                        type="email" 
                        placeholder="Join our newsletter" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-dark-950 border border-white/10 rounded-lg py-3 px-4 text-xs text-white focus:border-primary outline-none pr-10 transition-colors focus:bg-dark-900"
                     />
                     <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-white transition-colors">
                         <i className="fas fa-paper-plane"></i>
                     </button>
                 </form>
              </div>
           </div>
  
           {/* BOTTOM BAR */}
           <div className="border-t border-white/5 pt-8 pb-8 flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="text-center md:text-left">
                   <p className="text-gray-500 text-xs">
                       &copy; {new Date().getFullYear()} MHJoyGamersHub. All trademarks are property of their respective owners.
                   </p>
               </div>
               <div className="flex items-center gap-6">
                   <div className="flex items-center gap-2 bg-green-500/5 px-3 py-1 rounded-full border border-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-500 text-[10px] font-bold uppercase tracking-wider">All Systems Operational</span>
                   </div>
               </div>
           </div>
       </div>
    </footer>
  );
};
