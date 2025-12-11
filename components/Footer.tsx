
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { config } from '../config';
import { TrustPilotWidget } from './TrustPilotWidget'; // Import Widget

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
                  <p className="text-gray-400 text-sm leading-relaxed border-l-2 border-white/10 pl-4 font-bengali">
                      MHJoyGamersHub বাংলাদেশের গেমারদের জন্য সবচেয়ে বিশ্বস্ত ডিজিটাল মার্কেটপ্লেস। 
                      <br/><span className="text-xs font-sans mt-1 block opacity-70">Bangladesh's most trusted digital marketplace for gamers.</span>
                  </p>
                  
                  {/* Social Links */}
                  <div>
                      <h5 className="text-white text-xs font-bold uppercase mb-2">Follow Us / আমাদের অনুসরণ করুন</h5>
                      <div className="flex gap-3">
                          <a href={config.social.facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-dark-900 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all transform hover:-translate-y-1"><i className="fab fa-facebook-f"></i></a>
                          <a href={config.social.discord} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-dark-900 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#5865F2] hover:text-white hover:border-[#5865F2] transition-all transform hover:-translate-y-1"><i className="fab fa-discord"></i></a>
                          <a href={config.social.instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-dark-900 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#E4405F] hover:text-white hover:border-[#E4405F] transition-all transform hover:-translate-y-1"><i className="fab fa-instagram"></i></a>
                          <a href={config.contact.whatsapp} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-dark-900 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all transform hover:-translate-y-1"><i className="fab fa-whatsapp"></i></a>
                      </div>
                  </div>
              </div>
  
              {/* MY ACCOUNT */}
              <div>
                 <h4 className="text-white font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-xs">
                     <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> My Account / আমার অ্যাকাউন্ট
                 </h4>
                 <ul className="space-y-3 text-sm text-gray-400">
                    <li><Link to="/cart" className="hover:text-primary hover:translate-x-1 transition-all inline-block font-bengali">My Cart / আমার কার্ট</Link></li>
                    <li><Link to="/track-order" className="hover:text-primary hover:translate-x-1 transition-all inline-block font-bold text-white relative font-bengali">Track Order / অর্ডার ট্র্যাক করুন <span className="absolute -right-2 top-0 w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span></Link></li>
                    <li><Link to="/dashboard" className="hover:text-primary hover:translate-x-1 transition-all inline-block font-bengali">My Codes / আমার কোড</Link></li>
                    <li><Link to="/login" className="hover:text-primary hover:translate-x-1 transition-all inline-block font-bengali">Login / রেজিস্টার</Link></li>
                 </ul>
              </div>
  
              {/* HELP CENTER */}
              <div>
                 <h4 className="text-white font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-xs">
                     <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Legal & Help / আইনি তথ্য
                 </h4>
                 <ul className="space-y-3 text-sm text-gray-400">
                    <li><Link to="/about" className="hover:text-primary hover:translate-x-1 transition-all inline-block font-bengali">About Us / আমাদের সম্পর্কে</Link></li>
                    <li><Link to="/contact" className="hover:text-primary hover:translate-x-1 transition-all inline-block font-bengali">Contact Support / যোগাযোগ</Link></li>
                    <li><Link to="/terms" className="hover:text-primary hover:translate-x-1 transition-all inline-block font-bengali">Terms of Service / শর্তাবলী</Link></li>
                    <li><Link to="/privacy" className="hover:text-primary hover:translate-x-1 transition-all inline-block font-bengali">Privacy Policy / গোপনীয়তা</Link></li>
                    <li><Link to="/refund" className="hover:text-primary hover:translate-x-1 transition-all inline-block font-bengali">Refund Policy / রিফান্ড পলিসি</Link></li>
                 </ul>
              </div>
  
              {/* SECURE PAYMENT */}
              <div>
                 <h4 className="text-white font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-xs">
                     <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Secure Payment / পেমেন্ট
                 </h4>
                 <p className="text-xs text-gray-500 mb-4 font-bengali">আমরা ১০০% নিরাপদ পেমেন্ট গ্রহণ করি। <span className="font-sans text-[10px] block mt-0.5">We accept 100% secure payments.</span></p>
                 
                 {/* Updated Logos: Mixed Image & Icons for Sleek Look */}
                 <div className="flex flex-wrap gap-3 mb-6 items-center">
                      {/* Local Methods (Images with transparent BG) */}
                      <div className="h-9 w-14 bg-white/5 border border-white/10 rounded flex items-center justify-center p-1 hover:bg-white/10 transition-colors" title="bKash">
                          <img src="https://freepnglogo.com/images/all_img/1701503524bkash-logo-transparent.png" alt="bKash" className="h-full object-contain" />
                      </div>
                      <div className="h-9 w-14 bg-white/5 border border-white/10 rounded flex items-center justify-center p-1 hover:bg-white/10 transition-colors" title="Nagad">
                          <img src="https://freepnglogo.com/images/all_img/1701511252nagad-logo-transparent.png" alt="Nagad" className="h-full object-contain" />
                      </div>
                      <div className="h-9 w-14 bg-white/5 border border-white/10 rounded flex items-center justify-center p-1 hover:bg-white/10 transition-colors" title="Rocket">
                          <img src="https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D1CC458D-seeklogo.com.png" alt="Rocket" className="h-full object-contain" />
                      </div>
                      
                      {/* Global Cards (FontAwesome for perfect Dark Mode integration) */}
                      <div className="h-9 w-14 bg-blue-600/10 border border-blue-500/20 rounded flex items-center justify-center text-blue-400 text-2xl hover:bg-blue-600/20 transition-colors" title="Visa">
                          <i className="fab fa-cc-visa"></i>
                      </div>
                      <div className="h-9 w-14 bg-red-600/10 border border-red-500/20 rounded flex items-center justify-center text-red-400 text-2xl hover:bg-red-600/20 transition-colors" title="Mastercard">
                          <i className="fab fa-cc-mastercard"></i>
                      </div>
                      <div className="h-9 w-14 bg-cyan-600/10 border border-cyan-500/20 rounded flex items-center justify-center text-cyan-400 text-2xl hover:bg-cyan-600/20 transition-colors" title="Amex">
                          <i className="fab fa-cc-amex"></i>
                      </div>
                 </div>
                 
                 <form onSubmit={handleSubscribe} className="relative group mb-6">
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

                 {/* TRUSTPILOT IN FOOTER */}
                 <div className="opacity-80 hover:opacity-100 transition-opacity">
                     <TrustPilotWidget />
                 </div>
              </div>
           </div>
  
           {/* BOTTOM BAR */}
           <div className="border-t border-white/5 pt-8 pb-8 flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="text-center md:text-left">
                   <p className="text-gray-500 text-xs">
                       &copy; {new Date().getFullYear()} MHJoyGamersHub. All Rights Reserved. <span className="font-bengali">সর্বস্বত্ব সংরক্ষিত।</span>
                   </p>
                   {/* DBID FIELD FOR COMPLIANCE */}
                   <p className="text-gray-600 text-[10px] mt-1 uppercase tracking-widest font-bold">
                       DBID Registration: <span className="text-primary">Pending Application</span>
                   </p>
               </div>
               <div className="flex items-center gap-6">
                   <div className="flex items-center gap-2 bg-green-500/5 px-3 py-1 rounded-full border border-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-500 text-[10px] font-bold uppercase tracking-wider">System Operational</span>
                   </div>
               </div>
           </div>
       </div>
    </footer>
  );
};
