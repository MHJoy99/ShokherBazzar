
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { config } from '../config';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

const PageLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="min-h-screen bg-transparent pb-20 pt-32">
        <Helmet><title>{title} | {config.siteName}</title></Helmet>
        <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic mb-8 border-l-4 border-primary pl-6">{title}</h1>
            <div className="prose prose-invert prose-lg max-w-none bg-dark-900/50 p-8 rounded-2xl border border-white/5">{children}</div>
        </div>
    </div>
);

export const AboutPage: React.FC = () => (
    <PageLayout title="About Us">
        <p>Welcome to {config.siteName}, Bangladesh's premier destination for digital gaming goods.</p>
        <p>Founded in 2023, we aim to solve the payment issues gamers face in BD by providing a reliable platform that accepts bKash, Nagad, and local bank transfers for international game codes.</p>
        <h3>Our Mission</h3>
        <p>To provide instant, secure, and affordable access to the global digital economy for every Bangladeshi gamer.</p>
    </PageLayout>
);

export const ContactPage: React.FC = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    
    // State for form fields
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
        <PageLayout title="Contact Support">
            {!sent ? (
                <>
                    <p>Need help with an order? We are here for you 24/7.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose my-8">
                        <div className="bg-dark-950 p-6 rounded-xl border border-white/10"><i className="fas fa-envelope text-primary text-2xl mb-4"></i><h3 className="text-white font-bold">Email Us</h3><p className="text-gray-400">{config.contact.email}</p></div>
                        <div className="bg-dark-950 p-6 rounded-xl border border-white/10"><i className="fab fa-whatsapp text-green-500 text-2xl mb-4"></i><h3 className="text-white font-bold">WhatsApp</h3><p className="text-gray-400">{config.contact.phone}</p></div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4 not-prose">
                        <input 
                            required 
                            type="text" 
                            placeholder="Your Name" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-dark-950 border border-white/10 p-4 rounded-lg text-white focus:border-primary outline-none" 
                        />
                        <input 
                            required 
                            type="email" 
                            placeholder="Your Email" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-dark-950 border border-white/10 p-4 rounded-lg text-white focus:border-primary outline-none" 
                        />
                        <textarea 
                            required 
                            placeholder="Your Message" 
                            rows={4} 
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            className="w-full bg-dark-950 border border-white/10 p-4 rounded-lg text-white focus:border-primary outline-none"
                        ></textarea>
                        <button disabled={loading} className="bg-primary hover:bg-primary-hover text-black font-bold uppercase px-8 py-3 rounded-lg transition-colors">{loading ? 'Sending...' : 'Send Message'}</button>
                    </form>
                </>
            ) : (
                <div className="text-center py-12 not-prose">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 text-3xl"><i className="fas fa-check"></i></div>
                    <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                    <p className="text-gray-400">Our support team will get back to you within 2 hours.</p>
                </div>
            )}
        </PageLayout>
    );
};

export const TermsPage: React.FC = () => (
    <PageLayout title="Terms of Service">
        <p>By using {config.siteName}, you agree to the following terms...</p>
        <h3>1. Digital Goods</h3>
        <p>All products sold are digital codes. No physical items will be shipped.</p>
        <h3>2. Delivery</h3>
        <p>Codes are delivered automatically to your email and dashboard upon payment confirmation.</p>
    </PageLayout>
);

export const PrivacyPage: React.FC = () => (
    <PageLayout title="Privacy Policy">
        <p>Your privacy is important to us.</p>
        <h3>Data Collection</h3>
        <p>We collect your email and phone number solely for order delivery and support purposes.</p>
    </PageLayout>
);

export const RefundPage: React.FC = () => (
    <PageLayout title="Refund Policy">
        <p>Due to the nature of digital products, refunds are generally not possible once a code has been viewed or redeemed.</p>
    </PageLayout>
);
