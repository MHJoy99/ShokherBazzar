
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { config } from '../config';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { motion } from 'framer-motion';

// --- SHARED LAYOUT ---
const PageLayout: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="min-h-screen bg-transparent pb-20 pt-28">
        <Helmet><title>{title} | {config.siteName}</title></Helmet>
        
        <div className="max-w-4xl mx-auto px-4 md:px-8 mb-12 text-center">
             <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
             >
                <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tight mb-4">{title}</h1>
                {subtitle && <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">{subtitle}</p>}
                <div className="h-1 w-24 bg-primary mx-auto mt-6 rounded-full shadow-glow"></div>
             </motion.div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="prose-custom bg-dark-900/30 backdrop-blur-sm p-6 md:p-12 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
                {children}
            </motion.div>
        </div>
    </div>
);

// --- ABOUT PAGE ---
export const AboutPage: React.FC = () => (
    <PageLayout title="About Us" subtitle="Where Affordability Meets Authenticity">
        
        <div className="mb-10 rounded-2xl overflow-hidden border border-white/10 relative h-64 md:h-80 group">
             <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop" alt="MHJoyGamersHub Gaming" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
             <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent"></div>
             <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">
                 <h2 className="!mt-0 !mb-2 !border-none !text-3xl md:!text-4xl">MHJoyGamersHub Gaming Platform</h2>
                 <p className="!mb-0 text-primary font-bold uppercase tracking-widest">Est. 2024</p>
             </div>
        </div>

        <h2>Who We Are</h2>
        <p>
            MHJoyGamersHub is Bangladesh's most trusted digital marketplace for gamers. Since our establishment, we've been committed to delivering authentic, affordable, and accessible gaming products to our community. We are the official reseller of premium digital products including Steam Wallet, Google Play, Free Fire, and much more.
        </p>

        <div className="bg-dark-900 border-l-4 border-primary p-6 rounded-r-xl my-8">
            <h3 className="!mt-0 !mb-2 text-white uppercase tracking-widest text-xs font-bold">Our Motto</h3>
            <p className="!mb-0 text-xl font-medium italic text-white">"I will do no more than one deal, but that one deal must be honest!"</p>
            <p className="text-sm mt-4 !mb-0 text-gray-400">This simple yet powerful principle guides every transaction, every customer interaction, and every decision we make. We believe in integrity over volume, quality over quantity, and trust over transactions.</p>
        </div>

        <h2>Our Mission</h2>
        <p>We exist to bridge the gap between international gaming platforms and local gamers across Bangladesh. By offering competitive pricing, secure payment methods, and reliable delivery, we make premium gaming content accessible to everyone. Whether you're a casual mobile gamer, an intense PC enthusiast, or a console player, we have something for you.</p>

        <h2>What We Offer</h2>
        <p><strong>Digital Products & Services:</strong></p>
        <ul>
            <li><strong>Steam Wallet Codes:</strong> Add balance to your Steam account and unlock thousands of games.</li>
            <li><strong>Google Play Credit:</strong> Download apps, games, music, movies, and more.</li>
            <li><strong>Free Fire Diamonds & Bundles:</strong> Enhance your gameplay with in-game currency.</li>
            <li><strong>PlayStation Network Cards:</strong> Access PS5 and PS4 gaming library.</li>
            <li><strong>Gaming Accounts:</strong> Verified and secure accounts for popular titles.</li>
            <li><strong>Digital Gift Cards:</strong> Perfect for gifting to friends and family.</li>
        </ul>
        <p>Each product is sourced responsibly and delivered instantly to ensure your gaming experience is never interrupted.</p>

        <h2>Why Choose MHJoyGamersHub?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                <i className="fas fa-check-circle text-primary text-2xl mb-4"></i>
                <h3 className="!mt-0 !text-white">Authenticity Guaranteed</h3>
                <p className="!mb-0 text-sm">Every product we sell is legitimate and verified. We work directly with authorized channels to ensure you're getting genuine digital goods.</p>
            </div>
            <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                <i className="fas fa-tags text-primary text-2xl mb-4"></i>
                <h3 className="!mt-0 !text-white">Competitive Pricing</h3>
                <p className="!mb-0 text-sm">We negotiate the best rates so you save money. What you pay is what you get—no hidden fees, no surprises.</p>
            </div>
            <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                <i className="fas fa-bolt text-primary text-2xl mb-4"></i>
                <h3 className="!mt-0 !text-white">Instant Delivery</h3>
                <p className="!mb-0 text-sm">No waiting periods. Your codes are delivered immediately after successful payment. Start gaming within minutes.</p>
            </div>
            <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                <i className="fas fa-lock text-primary text-2xl mb-4"></i>
                <h3 className="!mt-0 !text-white">Secure Transactions</h3>
                <p className="!mb-0 text-sm">We accept multiple payment methods including local Bangladesh gateways (Nagad, Bkash, Rocket) and international cards.</p>
            </div>
        </div>

        <div className="important-box">
             <h3 className="!mt-0 !text-white flex items-center gap-2"><i className="fas fa-heart text-red-500"></i> The Values That Drive Us</h3>
             <ul className="!mb-0">
                 <li><strong>Honesty First:</strong> We never mislead our customers. What you see is what you get.</li>
                 <li><strong>Customer-Centric:</strong> Your satisfaction is our success metric. We listen, adapt, and improve based on your feedback.</li>
                 <li><strong>Reliability:</strong> When you order with us, you can count on us. Delivery, support, quality—all reliable.</li>
             </ul>
        </div>

        <h2>Connect With Us</h2>
        <p>Have questions? Want to learn more? Reach out to our support team:</p>
        <ul>
            <li><strong>Support Email:</strong> support@mhjoygamershub.com</li>
            <li><strong>WhatsApp:</strong> <a href={config.contact.whatsapp} target="_blank">Business WhatsApp Link</a></li>
            <li><strong>Facebook:</strong> <a href={config.social.facebook} target="_blank">Facebook Page</a></li>
        </ul>
        <p className="text-center font-bold text-white mt-8 border-t border-white/10 pt-8">MHJoyGamersHub - Where Affordability Meets Authenticity!</p>
    </PageLayout>
);

// --- TERMS PAGE ---
export const TermsPage: React.FC = () => (
    <PageLayout title="Terms of Service" subtitle="Last Updated: December 2024">
        
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using the MHJoyGamersHub website and services (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, you must stop using our Service immediately. These Terms of Service constitute the entire agreement between you and MHJoyGamersHub regarding your use of the Service.</p>

        <h2>2. Definitions</h2>
        <ul>
            <li><strong>"We," "Us," "Our"</strong> refers to MHJoyGamersHub and its operators.</li>
            <li><strong>"You," "Your"</strong> refers to the user/customer.</li>
            <li><strong>"Service"</strong> means the MHJoyGamersHub website, platforms, and all digital products/services offered.</li>
            <li><strong>"Digital Products"</strong> includes Steam Wallet codes, Google Play credits, Free Fire diamonds, gaming accounts, gift cards, and similar digital goods.</li>
        </ul>

        <h2>3. Eligibility</h2>
        <p>To use MHJoyGamersHub, you must:</p>
        <ul>
            <li>Be at least 13 years old (or the minimum age in your jurisdiction).</li>
            <li>Have the legal capacity to enter into binding agreements.</li>
            <li>Not be restricted by any laws in your country from using digital commerce platforms.</li>
        </ul>

        <h2>4. User Accounts & Registration</h2>
        <p><strong>Creating an Account:</strong> You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and truthful information.</p>
        <p><strong>Account Termination:</strong> We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activities, or attempt to manipulate transactions.</p>

        <h2>5. Digital Products & Ordering</h2>
        <p><strong>How It Works:</strong></p>
        <ol>
            <li>Browse and select your desired digital product.</li>
            <li>Complete the payment process using our secure payment gateway.</li>
            <li>Receive your digital product code/credentials immediately upon confirmation.</li>
            <li>Redeem the product on the respective platform (Steam, Google Play, etc.).</li>
        </ol>
        <div className="important-box">
             <strong>Product Authenticity:</strong> All digital products sold on MHJoyGamersHub are legitimately sourced, verified for authenticity, free from fraud, and compatible with the platforms they're designed for.
        </div>

        <h2>6. Payment Terms</h2>
        <p><strong>Accepted Payment Methods:</strong> Nagad, bKash, Rocket (Bangladesh mobile payment), Credit/Debit Cards, and International gateways.</p>
        <p><strong>Payment Security:</strong> All payments are processed through secure, encrypted connections. We do not store your full credit card details.</p>

        <h2>7. Refund & Cancellation Policy</h2>
        <p>Digital products (codes, accounts, currencies) are <strong>generally non-refundable</strong> once delivered and redeemed, as they are consumed digital goods. Please refer to our full <strong>Refund Policy</strong> page for specific conditions regarding Failed Delivery or Defective Products.</p>

        <h2>8. User Conduct & Prohibited Activities</h2>
        <p>You agree NOT to:</p>
        <ul>
            <li>Use the Service for any illegal activities.</li>
            <li>Attempt to gain unauthorized access to our systems.</li>
            <li>Distribute malware or viruses.</li>
            <li>Engage in fraudulent transactions or chargeback fraud.</li>
            <li>Resell or redistribute products without authorization.</li>
        </ul>

        <h2>9. Intellectual Property Rights</h2>
        <p>All content on MHJoyGamersHub is the property of MHJoyGamersHub or its licensors. Third-party trademarks (Steam, Google Play, etc.) are property of their respective owners; we are authorized resellers.</p>

        <h2>10. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, MHJoyGamersHub shall not be liable for indirect, incidental, special, or consequential damages. Our total liability shall not exceed the amount you paid for the product in question.</p>

        <h2>11. Warranty Disclaimer</h2>
        <p>The Service is provided "AS IS" and "AS AVAILABLE." We make no warranties regarding uninterrupted service or specific results. Digital products work as intended when redeemed on their respective platforms.</p>

        <h2>12. Governing Law</h2>
        <p>These Terms of Service are governed by and construed in accordance with the laws of Bangladesh. Both parties agree to submit to the exclusive jurisdiction of the courts of Bangladesh.</p>

        <h2>13. Contact Information</h2>
        <p>For questions or concerns regarding these Terms of Service:</p>
        <ul>
            <li><strong>Email:</strong> support@mhjoygamershub.com</li>
            <li><strong>WhatsApp:</strong> <a href={config.contact.whatsapp}>Business WhatsApp</a></li>
        </ul>
    </PageLayout>
);

// --- PRIVACY PAGE ---
export const PrivacyPage: React.FC = () => (
    <PageLayout title="Privacy Policy" subtitle="Your Data is Safe With Us">
        
        <h2>1. Introduction</h2>
        <p>MHJoyGamersHub is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.</p>

        <h2>2. Information We Collect</h2>
        <h3>A. Information You Provide Directly:</h3>
        <ul>
            <li><strong>Registration:</strong> Full name, Email address, Phone number, Username/Password.</li>
            <li><strong>Payment:</strong> Payment method details, Billing address, Transaction history (We do not see full card details).</li>
            <li><strong>Communication:</strong> Messages sent to support, Feedback, and Reviews.</li>
        </ul>
        <h3>B. Information Collected Automatically:</h3>
        <ul>
            <li><strong>Technical:</strong> IP address, Browser type, Device type, Operating system.</li>
            <li><strong>Usage:</strong> Pages visited, Products viewed, Clicks, Time spent.</li>
            <li><strong>Location:</strong> Approximate location based on IP address.</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <ul>
            <li><strong>Service Delivery:</strong> Process orders, Send codes, Deliver invoices.</li>
            <li><strong>Communication:</strong> Send order updates, Respond to support inquiries.</li>
            <li><strong>Security:</strong> Detect and prevent fraud, Monitor unauthorized access.</li>
            <li><strong>Improvement:</strong> Analyze user behavior to improve website performance.</li>
            <li><strong>Marketing:</strong> Send promotional offers (only with consent).</li>
        </ul>

        <h2>4. How We Protect Your Information</h2>
        <div className="important-box">
             <i className="fas fa-shield-alt mb-2 text-2xl block text-primary"></i>
             <strong>Security Measures:</strong> We use SSL/TLS encryption for all data transmission. Secure payment gateways (PCI-DSS compliant) handle financial data. We perform regular security audits and vulnerability testing.
        </div>

        <h2>5. Data Sharing & Disclosure</h2>
        <p>We <strong>DO NOT</strong> sell your personal information to third parties. We share data only with:</p>
        <ul>
            <li><strong>Payment Processors:</strong> To handle secure transactions.</li>
            <li><strong>Delivery Partners:</strong> For logistics (if applicable).</li>
            <li><strong>Legal Requirements:</strong> When required by law or to prevent fraud.</li>
        </ul>

        <h2>6. Cookies & Tracking Technologies</h2>
        <p>We use Essential Cookies for session management, Functional Cookies for preferences, and Analytics Cookies to improve user experience. You can control cookies through your browser settings.</p>

        <h2>7. Your Privacy Rights</h2>
        <ul>
            <li><strong>Access:</strong> Request a copy of your personal data.</li>
            <li><strong>Correction:</strong> Request corrections to inaccurate info.</li>
            <li><strong>Deletion:</strong> Request deletion of your personal info (subject to legal retention).</li>
            <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails.</li>
        </ul>

        <h2>8. Data Retention</h2>
        <p>We retain transaction data for 7 years (for tax compliance) and account data while the account is active. We delete or anonymize data when no longer needed.</p>

        <h2>9. Children's Privacy</h2>
        <p>MHJoyGamersHub is not intended for users under 13. We do not knowingly collect information from children.</p>

        <h2>10. Contact Us</h2>
        <p>For privacy-related questions, contact us at: <strong>privacy@mhjoygamershub.com</strong></p>
    </PageLayout>
);

// --- REFUND PAGE ---
export const RefundPage: React.FC = () => (
    <PageLayout title="Refund Policy" subtitle="Fair Resolutions for Digital Goods">
        
        <div className="mb-8 p-6 bg-dark-900 border border-white/10 rounded-2xl flex items-start gap-4">
            <i className="fas fa-info-circle text-3xl text-primary mt-1"></i>
            <div>
                <h3 className="!mt-0 text-white font-bold">Policy Overview</h3>
                <p className="!mb-0 text-sm">MHJoyGamersHub is committed to customer satisfaction. This Refund Policy outlines when and how we provide refunds for orders.</p>
            </div>
        </div>

        <div className="warning-box">
            <strong>Important:</strong> Digital products (codes, accounts, in-game currency) are <strong>consumed goods</strong>. Once redeemed, they cannot be refunded. However, we offer refunds in specific circumstances outlined below.
        </div>

        <h2>1. Non-Refundable Situations</h2>
        <p>We generally <strong>cannot</strong> issue refunds if:</p>
        <ul>
            <li>You successfully received and redeemed the product code.</li>
            <li>You purchased the wrong product or region version by mistake.</li>
            <li>You changed your mind after receiving the product.</li>
            <li>You lost access to your account after redemption due to your own actions.</li>
            <li>Refusal of legitimate product (you refuse to provide proof of redemption attempt).</li>
        </ul>

        <h2>2. Refundable Situations</h2>
        <p>We <strong>will provide refunds</strong> in these specific cases:</p>
        
        <h3>A. Failed Delivery (Within 24 Hours)</h3>
        <ul>
            <li>Product code was not delivered within 24 hours.</li>
            <li>System error prevented product delivery.</li>
        </ul>
        <p><strong>Claim Process:</strong> Contact support within 24h with Order ID. Refund timeline: 3-5 business days.</p>

        <h3>B. Defective/Non-Functional Product</h3>
        <ul>
            <li>The code/account doesn't work on the target platform.</li>
            <li>Multiple redemption attempts fail.</li>
            <li>The code was already redeemed before you received it.</li>
        </ul>
        <p><strong>Claim Process:</strong> Attempt redemption on correct platform. Take screenshots of error. Contact support. We will verify and replace or refund.</p>

        <h3>C. Unauthorized Charges</h3>
        <ul>
            <li>You don't recognize the charge.</li>
            <li>Someone else used your account without permission.</li>
        </ul>
        <p><strong>Claim Process:</strong> Contact support immediately. File a dispute if necessary.</p>

        <h2>3. Special Cases & Appeal Process</h2>
        <p>If your situation doesn't fit neatly into our policy, we may review it individually. Send a detailed explanation with evidence to <strong>appeals@mhjoygamershub.com</strong>.</p>

        <h2>4. Refund Processing</h2>
        <ul>
            <li><strong>Verification:</strong> 3-7 business days.</li>
            <li><strong>Processing:</strong> 5-10 business days (varies by bank/gateway).</li>
            <li><strong>Total:</strong> Expect refund in 2-3 weeks.</li>
        </ul>
        <p>Refunds are generally issued to the original payment method (bKash/Nagad/Card).</p>

        <h2>5. Cancellation Policy</h2>
        <p><strong>Before Payment:</strong> Cancel anytime.</p>
        <p><strong>After Payment, Before Delivery:</strong> Full refund available (cancel within 1 hour).</p>
        <p><strong>After Delivery:</strong> Non-cancellable.</p>

        <h2>6. Refund Restrictions</h2>
        <p>We cannot issue refunds if more than 30 days have passed, if you violate our Terms, or if we have evidence of refund fraud.</p>

        <h2>7. Contact For Refunds</h2>
        <ul>
            <li><strong>Email:</strong> refunds@mhjoygamershub.com</li>
            <li><strong>Support Chat:</strong> Available on website.</li>
        </ul>
    </PageLayout>
);

// --- CONTACT PAGE ---
export const ContactPage: React.FC = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try { 
            await api.sendMessage(formData); 
            setSent(true); 
            showToast("Message sent successfully!"); 
        } catch (error) { 
            showToast("Failed to send message", 'error'); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <PageLayout title="Contact Support" subtitle="We're Here to Help 24/7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="bg-dark-900 p-8 rounded-2xl border border-white/10 flex flex-col items-center text-center hover:border-primary/50 transition-colors group shadow-lg">
                    <div className="w-16 h-16 bg-dark-950 rounded-full flex items-center justify-center mb-4 border border-white/10 group-hover:scale-110 transition-transform shadow-glow">
                        <i className="fas fa-envelope text-primary text-2xl"></i>
                    </div>
                    <h3 className="!mt-0 text-white uppercase font-bold">Email Support</h3>
                    <p className="text-sm text-gray-400 mb-4">Best for detailed inquiries</p>
                    <a href={`mailto:${config.contact.email}`} className="text-white font-bold hover:text-primary transition-colors">{config.contact.email}</a>
                </div>
                
                <div className="bg-dark-900 p-8 rounded-2xl border border-white/10 flex flex-col items-center text-center hover:border-green-500/50 transition-colors group shadow-lg">
                    <div className="w-16 h-16 bg-dark-950 rounded-full flex items-center justify-center mb-4 border border-white/10 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                        <i className="fab fa-whatsapp text-green-500 text-3xl"></i>
                    </div>
                    <h3 className="!mt-0 text-white uppercase font-bold">WhatsApp</h3>
                    <p className="text-sm text-gray-400 mb-4">Best for instant answers</p>
                    <a href={config.contact.whatsapp} target="_blank" rel="noreferrer" className="text-white font-bold hover:text-green-500 transition-colors">{config.contact.phone}</a>
                </div>
            </div>

            <div className="bg-dark-900 p-8 rounded-2xl border border-white/10 shadow-2xl">
                <h2 className="!mt-0 !mb-6 text-center">Send us a Message</h2>
                {!sent ? (
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input 
                                required 
                                type="text" 
                                placeholder="Your Name" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-dark-950 border border-white/10 p-4 rounded-xl text-white focus:border-primary outline-none transition-colors" 
                            />
                            <input 
                                required 
                                type="email" 
                                placeholder="Your Email" 
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full bg-dark-950 border border-white/10 p-4 rounded-xl text-white focus:border-primary outline-none transition-colors" 
                            />
                        </div>
                        <textarea 
                            required 
                            placeholder="How can we help you?" 
                            rows={5} 
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            className="w-full bg-dark-950 border border-white/10 p-4 rounded-xl text-white focus:border-primary outline-none transition-colors"
                        ></textarea>
                        <button disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase py-4 rounded-xl shadow-glow transition-all">
                            {loading ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 text-3xl animate-bounce">
                            <i className="fas fa-check"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                        <p className="text-gray-400">Our support team will get back to you within 2 hours.</p>
                        <button onClick={() => setSent(false)} className="mt-8 text-primary font-bold uppercase hover:underline">Send Another</button>
                    </div>
                )}
            </div>
        </PageLayout>
    );
};
