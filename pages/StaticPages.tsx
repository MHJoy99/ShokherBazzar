
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { config } from '../config';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { motion } from 'framer-motion';

// --- SHARED BILINGUAL LAYOUT COMPONENTS ---

const PageHeader: React.FC<{ titleEn: string; titleBn: string; subtitleEn?: string; subtitleBn?: string }> = ({ titleEn, titleBn, subtitleEn, subtitleBn }) => (
    <div className="max-w-7xl mx-auto px-4 md:px-8 mb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tight mb-2">
                {titleEn} <span className="text-primary">/ {titleBn}</span>
            </h1>
            {subtitleEn && (
                <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto font-bengali">
                    {subtitleBn} <span className="text-sm block font-sans opacity-70 mt-1">{subtitleEn}</span>
                </p>
            )}
            <div className="h-1 w-24 bg-primary mx-auto mt-6 rounded-full shadow-glow"></div>
        </motion.div>
    </div>
);

const BilingualSection: React.FC<{ 
    titleEn?: string; 
    titleBn?: string; 
    contentEn: React.ReactNode; 
    contentBn: React.ReactNode; 
    icon?: string;
    highlight?: boolean;
}> = ({ titleEn, titleBn, contentEn, contentBn, icon, highlight }) => (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12 ${highlight ? 'bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8' : ''}`}>
        {/* Bengali Side (Left) */}
        <div className={`font-bengali text-gray-300 leading-relaxed ${highlight ? '' : 'md:border-r md:border-white/5 md:pr-12'}`}>
            {(titleBn || icon) && (
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    {icon && <i className={`${icon} text-primary`}></i>}
                    {titleBn}
                </h2>
            )}
            <div className="prose-custom prose-lg">{contentBn}</div>
        </div>

        {/* English Side (Right) */}
        <div className="font-sans text-gray-400 leading-relaxed">
            {titleEn && (
                <h2 className="text-xl font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-3 opacity-90">
                    {icon && <i className={`${icon} text-primary md:hidden`}></i>}
                    {titleEn}
                </h2>
            )}
            <div className="prose-custom text-sm md:text-base">{contentEn}</div>
        </div>
    </div>
);

const PageContainer: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
    <div className="min-h-screen bg-transparent pb-20 pt-28">
        <Helmet><title>{title} | {config.siteName}</title></Helmet>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
            {children}
        </div>
    </div>
);

// --- ABOUT PAGE ---
export const AboutPage: React.FC = () => (
    <PageContainer title="About Us">
        <PageHeader 
            titleEn="About Us" 
            titleBn="আমাদের সম্পর্কে" 
            subtitleEn="Where Affordability Meets Authenticity"
            subtitleBn="যেখানে সাশ্রয়ী মূল্য এবং বিশ্বাসযোগ্যতা মিলিত হয়"
        />
        
        <div className="mb-16 rounded-3xl overflow-hidden border border-white/10 relative h-64 md:h-96 group shadow-2xl">
             <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop" alt="MHJoyGamersHub Gaming" className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" />
             <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent"></div>
             <div className="absolute bottom-8 left-8 md:bottom-16 md:left-16 max-w-3xl">
                 <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase mb-2">MHJoyGamersHub</h2>
                 <p className="text-primary font-bold font-bengali text-xl md:text-2xl">বাংলাদেশের গেমারদের জন্য সবচেয়ে বিশ্বস্ত ডিজিটাল মার্কেটপ্লেস</p>
             </div>
        </div>

        <BilingualSection 
            titleEn="Who We Are"
            titleBn="আমরা কে"
            icon="fas fa-users"
            contentBn={
                <p>
                    MHJoyGamersHub বাংলাদেশের গেমারদের জন্য সবচেয়ে বিশ্বস্ত ডিজিটাল মার্কেটপ্লেস। আমাদের প্রতিষ্ঠার পর থেকে, আমরা আমাদের কমিউনিটির কাছে আসল, সাশ্রয়ী এবং সহজলভ্য গেম পণ্য পৌঁছে দিতে প্রতিশ্রুতিবদ্ধ। আমরা স্টিম ওয়ালেট, গুগল প্লে, ফ্রি ফায়ার এবং আরও অনেক কিছুর অফিসিয়াল রিসেলার।
                </p>
            }
            contentEn={
                <p>
                    MHJoyGamersHub is Bangladesh's most trusted digital marketplace for gamers. Since our establishment, we've been committed to delivering authentic, affordable, and accessible gaming products to our community. We are the official reseller of premium digital products including Steam Wallet, Google Play, Free Fire, and much more.
                </p>
            }
        />

        <div className="bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary p-8 rounded-r-2xl mb-16 shadow-glow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-primary font-bold uppercase tracking-widest text-xs mb-2">Our Motto</h3>
                    <p className="text-2xl font-black text-white italic font-bengali">"আমি একটির বেশি ডিল করব না, তবে সেই ডিলটি হতে হবে সৎ!"</p>
                    <p className="text-gray-400 mt-2 text-sm">সততা এবং গুণমানের প্রতি আমাদের অবিচল প্রতিশ্রুতি।</p>
                </div>
                <div>
                    <h3 className="text-primary font-bold uppercase tracking-widest text-xs mb-2">Translation</h3>
                    <p className="text-xl font-bold text-white italic">"I will do no more than one deal, but that one deal must be honest!"</p>
                    <p className="text-gray-400 mt-2 text-sm">We believe in integrity over volume, quality over quantity, and trust over transactions.</p>
                </div>
            </div>
        </div>

        <BilingualSection 
            titleEn="What We Offer"
            titleBn="আমরা যা অফার করি"
            icon="fas fa-box-open"
            contentBn={
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>স্টিম ওয়ালেট কোড:</strong> আপনার স্টিম অ্যাকাউন্টে ব্যালেন্স যোগ করুন এবং হাজার হাজার গেম আনলক করুন।</li>
                    <li><strong>গুগল প্লে ক্রেডিট:</strong> অ্যাপ, গেম, মিউজিক এবং মুভি ডাউনলোড করুন।</li>
                    <li><strong>ফ্রি ফায়ার ডায়মন্ড:</strong> ইন-গেম কারেন্সি দিয়ে আপনার গেমপ্লে উন্নত করুন।</li>
                    <li><strong>প্লেস্টেশন নেটওয়ার্ক কার্ড:</strong> PS5 এবং PS4 গেমিং লাইব্রেরি অ্যাক্সেস করুন।</li>
                    <li><strong>ডিজিটাল গিফট কার্ড:</strong> বন্ধুদের উপহার দেওয়ার জন্য সেরা।</li>
                </ul>
            }
            contentEn={
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Steam Wallet Codes:</strong> Add balance to your Steam account and unlock thousands of games.</li>
                    <li><strong>Google Play Credit:</strong> Download apps, games, music, movies, and more.</li>
                    <li><strong>Free Fire Diamonds:</strong> Enhance your gameplay with in-game currency.</li>
                    <li><strong>PlayStation Network Cards:</strong> Access PS5 and PS4 gaming library.</li>
                    <li><strong>Digital Gift Cards:</strong> Perfect for gifting to friends and family.</li>
                </ul>
            }
        />

        <h2 className="text-3xl font-black text-white text-center mb-12 uppercase italic">Why Choose Us / <span className="text-primary font-bengali not-italic">কেন আমাদের বেছে নেবেন?</span></h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-dark-900 border border-white/5 p-6 rounded-2xl hover:border-primary/50 transition-all group">
                <i className="fas fa-check-circle text-4xl text-green-500 mb-4 group-hover:scale-110 transition-transform block"></i>
                <h3 className="text-white font-bold text-lg mb-2 font-bengali">বিশ্বস্ততা নিশ্চিত</h3>
                <h4 className="text-gray-500 text-xs font-bold uppercase mb-4">Authenticity Guaranteed</h4>
                <p className="text-gray-400 text-sm font-bengali">প্রতিটি পণ্য আসল এবং যাচাইকৃত। আমরা অনুমোদিত চ্যানেলের সাথে সরাসরি কাজ করি।</p>
            </div>
            <div className="bg-dark-900 border border-white/5 p-6 rounded-2xl hover:border-primary/50 transition-all group">
                <i className="fas fa-bolt text-4xl text-yellow-500 mb-4 group-hover:scale-110 transition-transform block"></i>
                <h3 className="text-white font-bold text-lg mb-2 font-bengali">তাৎক্ষণিক ডেলিভারি</h3>
                <h4 className="text-gray-500 text-xs font-bold uppercase mb-4">Instant Delivery</h4>
                <p className="text-gray-400 text-sm font-bengali">কোন অপেক্ষার সময় নেই। পেমেন্টের সাথে সাথেই কোড ডেলিভারি।</p>
            </div>
            <div className="bg-dark-900 border border-white/5 p-6 rounded-2xl hover:border-primary/50 transition-all group">
                <i className="fas fa-shield-alt text-4xl text-blue-500 mb-4 group-hover:scale-110 transition-transform block"></i>
                <h3 className="text-white font-bold text-lg mb-2 font-bengali">নিরাপদ পেমেন্ট</h3>
                <h4 className="text-gray-500 text-xs font-bold uppercase mb-4">Secure Transactions</h4>
                <p className="text-gray-400 text-sm font-bengali">বিকাশ, নগদ এবং রকেটের মাধ্যমে ১০০% নিরাপদ পেমেন্ট।</p>
            </div>
            <div className="bg-dark-900 border border-white/5 p-6 rounded-2xl hover:border-primary/50 transition-all group">
                <i className="fas fa-headset text-4xl text-pink-500 mb-4 group-hover:scale-110 transition-transform block"></i>
                <h3 className="text-white font-bold text-lg mb-2 font-bengali">এক্সপার্ট সাপোর্ট</h3>
                <h4 className="text-gray-500 text-xs font-bold uppercase mb-4">Expert Support</h4>
                <p className="text-gray-400 text-sm font-bengali">যেকোনো সমস্যায় আমাদের ডেডিকেটেড সাপোর্ট টিম সর্বদা প্রস্তুত।</p>
            </div>
        </div>

    </PageContainer>
);

// --- TERMS PAGE ---
export const TermsPage: React.FC = () => (
    <PageContainer title="Terms of Service">
        <PageHeader 
            titleEn="Terms of Service" 
            titleBn="শর্তাবলী" 
            subtitleEn="Please read these terms carefully before using our service."
            subtitleBn="আমাদের পরিষেবা ব্যবহার করার আগে দয়া করে এই শর্তাবলী মনোযোগ সহকারে পড়ুন।"
        />

        <BilingualSection 
            titleEn="1. Acceptance of Terms"
            titleBn="১. শর্তাবলী গ্রহণ"
            icon="fas fa-file-contract"
            highlight
            contentBn={<p>MHJoyGamersHub ওয়েবসাইট এবং পরিষেবাগুলি ব্যবহার করে, আপনি এই শর্তাবলীর সাথে সম্মত হচ্ছেন। যদি আপনি এই শর্তাবলীর কোন অংশের সাথে একমত না হন, তবে আপনাকে অবিলম্বে আমাদের পরিষেবা ব্যবহার বন্ধ করতে হবে।</p>}
            contentEn={<p>By accessing and using the MHJoyGamersHub website and services, you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, you must stop using our Service immediately.</p>}
        />

        <BilingualSection 
            titleEn="2. Eligibility"
            titleBn="২. যোগ্যতা"
            icon="fas fa-user-check"
            contentBn={
                <ul className="list-disc pl-5">
                    <li>আপনার বয়স কমপক্ষে ১৩ বছর হতে হবে।</li>
                    <li>চুক্তি করার আইনগত ক্ষমতা থাকতে হবে।</li>
                    <li>রেজিস্ট্রেশনের সময় সঠিক এবং সম্পূর্ণ তথ্য প্রদান করতে হবে।</li>
                </ul>
            }
            contentEn={
                <ul className="list-disc pl-5">
                    <li>Be at least 13 years old.</li>
                    <li>Have the legal capacity to enter into binding agreements.</li>
                    <li>Provide accurate and complete information during registration.</li>
                </ul>
            }
        />

        <BilingualSection 
            titleEn="3. User Accounts"
            titleBn="৩. ব্যবহারকারী অ্যাকাউন্ট"
            icon="fas fa-user-shield"
            contentBn={<p>আপনার অ্যাকাউন্টের তথ্যের গোপনীয়তা বজায় রাখার দায়িত্ব আপনার। আপনার অ্যাকাউন্টের অধীনে ঘটা সমস্ত কার্যকলাপের জন্য আপনি দায়ী। আমরা প্রতারণামূলক কার্যকলাপে জড়িত অ্যাকাউন্টগুলি স্থগিত বা বাতিল করার অধিকার রাখি।</p>}
            contentEn={<p>You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activities that occur under your account. We reserve the right to suspend accounts engaged in fraudulent activities.</p>}
        />

        <BilingualSection 
            titleEn="4. Digital Products & Ordering"
            titleBn="৪. ডিজিটাল পণ্য ও অর্ডার"
            icon="fas fa-shopping-cart"
            contentBn={
                <ul className="list-disc pl-5">
                    <li><strong>পণ্যের সত্যতা:</strong> আমাদের সকল পণ্য বৈধ উৎস থেকে সংগ্রহ করা এবং যাচাইকৃত।</li>
                    <li><strong>ডেলিভারি:</strong> পেমেন্ট নিশ্চিত হওয়ার পর অধিকাংশ পণ্য তাৎক্ষণিকভাবে ডেলিভারি করা হয়। সর্বোচ্চ সময় ২৪ ঘণ্টা।</li>
                    <li><strong>রিডিমেশন:</strong> কোডটি সংশ্লিষ্ট প্ল্যাটফর্মে (যেমন Steam, Google Play) রিডিম করতে হবে।</li>
                </ul>
            }
            contentEn={
                <ul className="list-disc pl-5">
                    <li><strong>Authenticity:</strong> All products are legitimately sourced and verified.</li>
                    <li><strong>Delivery:</strong> Most products are delivered instantly after payment confirmation. Max time 24 hours.</li>
                    <li><strong>Redemption:</strong> Codes must be redeemed on the respective platform (Steam, Google Play, etc.).</li>
                </ul>
            }
        />

        <BilingualSection 
            titleEn="5. Payment Terms"
            titleBn="৫. পেমেন্ট শর্তাবলী"
            icon="fas fa-credit-card"
            contentBn={<p>আমরা বিকাশ, নগদ, রকেট এবং আন্তর্জাতিক কার্ড গ্রহণ করি। সমস্ত পেমেন্ট নিরাপদ এবং এনক্রিপ্ট করা সংযোগের মাধ্যমে প্রক্রিয়া করা হয়। কোনো অননুমোদিত পেমেন্ট দাবি ৭ দিনের মধ্যে রিপোর্ট করতে হবে।</p>}
            contentEn={<p>We accept bKash, Nagad, Rocket, and International cards. All payments are processed through secure, encrypted connections. Unauthorized payment claims must be reported within 7 days.</p>}
        />

        <BilingualSection 
            titleEn="6. Limitation of Liability"
            titleBn="৬. দায়বদ্ধতার সীমাবদ্ধতা"
            icon="fas fa-exclamation-triangle"
            contentBn={<p>আইন দ্বারা অনুমোদিত সর্বোচ্চ সীমা পর্যন্ত, MHJoyGamersHub পরোক্ষ বা আনুষঙ্গিক ক্ষতির জন্য দায়ী থাকবে না। আমাদের মোট দায়বদ্ধতা আপনার প্রদান করা অর্থের পরিমাণের বেশি হবে না।</p>}
            contentEn={<p>To the maximum extent permitted by law, MHJoyGamersHub shall not be liable for indirect or consequential damages. Our total liability shall not exceed the amount you paid for the product.</p>}
        />

        <BilingualSection 
            titleEn="7. Governing Law"
            titleBn="৭. প্রযোজ্য আইন"
            icon="fas fa-gavel"
            contentBn={<p>এই শর্তাবলী বাংলাদেশের আইন অনুযায়ী পরিচালিত হবে। উভয় পক্ষ বাংলাদেশের আদালতের একচেটিয়া এখতিয়ারে সম্মত।</p>}
            contentEn={<p>These Terms of Service are governed by the laws of Bangladesh. Both parties agree to submit to the exclusive jurisdiction of the courts of Bangladesh.</p>}
        />

    </PageContainer>
);

// --- PRIVACY PAGE ---
export const PrivacyPage: React.FC = () => (
    <PageContainer title="Privacy Policy">
        <PageHeader 
            titleEn="Privacy Policy" 
            titleBn="গোপনীয়তা নীতি" 
            subtitleEn="We are committed to protecting your personal data."
            subtitleBn="আমরা আপনার ব্যক্তিগত তথ্য সুরক্ষায় প্রতিশ্রুতিবদ্ধ।"
        />

        <BilingualSection 
            titleEn="1. Information We Collect"
            titleBn="১. আমরা যে তথ্য সংগ্রহ করি"
            icon="fas fa-database"
            contentBn={
                <ul className="list-disc pl-5">
                    <li><strong>নিবন্ধন তথ্য:</strong> নাম, ইমেল ঠিকানা, ফোন নম্বর।</li>
                    <li><strong>পেমেন্ট তথ্য:</strong> পেমেন্ট মেথড এবং ট্রানজেকশন হিস্ট্রি (আমরা কার্ডের সম্পূর্ণ তথ্য সংরক্ষণ করি না)।</li>
                    <li><strong>প্রযুক্তিগত তথ্য:</strong> আইপি ঠিকানা, ব্রাউজার টাইপ এবং ডিভাইসের তথ্য।</li>
                </ul>
            }
            contentEn={
                <ul className="list-disc pl-5">
                    <li><strong>Registration Info:</strong> Name, Email, Phone number.</li>
                    <li><strong>Payment Info:</strong> Payment method and transaction history (We do not store full card details).</li>
                    <li><strong>Technical Info:</strong> IP address, Browser type, and Device info.</li>
                </ul>
            }
        />

        <BilingualSection 
            titleEn="2. How We Use Information"
            titleBn="২. তথ্যের ব্যবহার"
            icon="fas fa-cogs"
            contentBn={<p>আমরা আপনার তথ্য অর্ডার প্রসেসিং, সাপোর্ট প্রদান, প্রতারণা রোধ এবং ওয়েবসাইটের মানোন্নয়নে ব্যবহার করি। আপনার সম্মতি ছাড়া আমরা মার্কেটিং ইমেল পাঠাই না।</p>}
            contentEn={<p>We use your information for order processing, providing support, fraud prevention, and website improvement. We do not send marketing emails without your consent.</p>}
        />

        <BilingualSection 
            titleEn="3. Data Security"
            titleBn="৩. তথ্য নিরাপত্তা"
            icon="fas fa-lock"
            highlight
            contentBn={<p>আমরা SSL/TLS এনক্রিপশন এবং নিরাপদ পেমেন্ট গেটওয়ে ব্যবহার করি। আপনার ব্যক্তিগত তথ্য সুরক্ষিত রাখতে আমরা নিয়মিত নিরাপত্তা অডিট করি।</p>}
            contentEn={<p>We use SSL/TLS encryption and secure payment gateways. We perform regular security audits to keep your personal data safe.</p>}
        />

        <BilingualSection 
            titleEn="4. Data Sharing"
            titleBn="৪. তথ্য শেয়ারিং"
            icon="fas fa-share-alt"
            contentBn={<p>আমরা তৃতীয় পক্ষের কাছে আপনার ব্যক্তিগত তথ্য বিক্রি করি না। আমরা শুধুমাত্র পেমেন্ট প্রসেসর এবং আইনি প্রয়োজনে তথ্য শেয়ার করতে পারি।</p>}
            contentEn={<p>We DO NOT sell your personal information to third parties. We may share data only with payment processors and when required by law.</p>}
        />

        <BilingualSection 
            titleEn="5. Contact Us"
            titleBn="৫. যোগাযোগ"
            icon="fas fa-envelope"
            contentBn={<p>গোপনীয়তা সম্পর্কিত প্রশ্নের জন্য যোগাযোগ করুন: <strong>privacy@mhjoygamershub.com</strong></p>}
            contentEn={<p>For privacy-related questions, contact us at: <strong>privacy@mhjoygamershub.com</strong></p>}
        />
    </PageContainer>
);

// --- REFUND PAGE ---
export const RefundPage: React.FC = () => (
    <PageContainer title="Refund Policy">
        <PageHeader 
            titleEn="Refund Policy" 
            titleBn="রিফান্ড পলিসি" 
            subtitleEn="Fair resolutions for digital goods."
            subtitleBn="ডিজিটাল পণ্যের জন্য ন্যায্য সমাধান।"
        />

        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl mb-12 text-center">
            <h3 className="text-red-500 font-bold uppercase mb-2 font-sans flex items-center justify-center gap-2"><i className="fas fa-exclamation-circle"></i> Important Note / গুরুত্বপূর্ণ নোট</h3>
            <p className="text-gray-300 font-bengali">ডিজিটাল পণ্য (কোড, অ্যাকাউন্ট, কারেন্সি) একবার রিডিম করা হলে সাধারণত রিফান্ডযোগ্য নয়।</p>
            <p className="text-gray-500 text-sm mt-1">Digital products (codes, accounts) are generally non-refundable once redeemed.</p>
        </div>

        <BilingualSection 
            titleEn="1. Refundable Situations"
            titleBn="১. রিফান্ডযোগ্য পরিস্থিতি"
            icon="fas fa-check-circle"
            contentBn={
                <ul className="list-disc pl-5">
                    <li><strong>ডেলিভারি ব্যর্থতা:</strong> ২৪ ঘন্টার মধ্যে পণ্য না পেলে।</li>
                    <li><strong>ত্রুটিপূর্ণ পণ্য:</strong> কোড কাজ না করলে বা আগে থেকেই ব্যবহৃত হলে (যাচাই সাপেক্ষে)।</li>
                    <li><strong>অননুমোদিত চার্জ:</strong> আপনার অনুমতি ছাড়া ট্রানজেকশন হলে।</li>
                </ul>
            }
            contentEn={
                <ul className="list-disc pl-5">
                    <li><strong>Failed Delivery:</strong> Product not delivered within 24 hours.</li>
                    <li><strong>Defective Product:</strong> Code invalid or already used (subject to verification).</li>
                    <li><strong>Unauthorized Charges:</strong> Transaction made without your permission.</li>
                </ul>
            }
        />

        <BilingualSection 
            titleEn="2. Non-Refundable Situations"
            titleBn="২. রিফান্ড অযোগ্য পরিস্থিতি"
            icon="fas fa-times-circle"
            contentBn={
                <ul className="list-disc pl-5">
                    <li>আপনি ভুল পণ্য বা রিজিওন ক্রয় করলে।</li>
                    <li>পণ্যটি সফলভাবে ডেলিভারি এবং রিডিম করা হলে।</li>
                    <li>আপনার নিজের ভুলের কারণে অ্যাকাউন্টের অ্যাক্সেস হারালে।</li>
                </ul>
            }
            contentEn={
                <ul className="list-disc pl-5">
                    <li>Purchased the wrong product or region.</li>
                    <li>Product successfully delivered and redeemed.</li>
                    <li>Lost account access due to your own actions.</li>
                </ul>
            }
        />

        <BilingualSection 
            titleEn="3. Claim Process"
            titleBn="৩. আবেদন প্রক্রিয়া"
            icon="fas fa-clipboard-list"
            contentBn={
                <ol className="list-decimal pl-5">
                    <li>২৪ ঘন্টার মধ্যে সাপোর্টে যোগাযোগ করুন।</li>
                    <li>ত্রুটির স্ক্রিনশট এবং অর্ডার আইডি প্রদান করুন।</li>
                    <li>যাচাইকরণের পর ৩-৫ কর্মদিবসের মধ্যে রিফান্ড বা রিপ্লেসমেন্ট পাবেন।</li>
                </ol>
            }
            contentEn={
                <ol className="list-decimal pl-5">
                    <li>Contact support within 24 hours.</li>
                    <li>Provide screenshots of the error and Order ID.</li>
                    <li>Receive refund or replacement within 3-5 business days after verification.</li>
                </ol>
            }
        />

        <BilingualSection 
            titleEn="Contact for Refunds"
            titleBn="রিফান্ডের জন্য যোগাযোগ"
            icon="fas fa-envelope-open"
            highlight
            contentBn={<p>ইমেল: <strong>refunds@mhjoygamershub.com</strong><br/>অথবা আমাদের ওয়েবসাইটের লাইভ চ্যাট ব্যবহার করুন।</p>}
            contentEn={<p>Email: <strong>refunds@mhjoygamershub.com</strong><br/>Or use the Live Chat on our website.</p>}
        />

    </PageContainer>
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
        <PageContainer title="Contact Support">
            <PageHeader 
                titleEn="Contact Support" 
                titleBn="যোগাযোগ করুন" 
                subtitleEn="We're Here to Help 24/7"
                subtitleBn="আমরা ২৪/৭ আপনার সহায়তায় আছি"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="bg-dark-900 p-8 rounded-2xl border border-white/10 flex flex-col items-center text-center hover:border-primary/50 transition-colors group shadow-lg">
                    <div className="w-16 h-16 bg-dark-950 rounded-full flex items-center justify-center mb-4 border border-white/10 group-hover:scale-110 transition-transform shadow-glow">
                        <i className="fas fa-envelope text-primary text-2xl"></i>
                    </div>
                    <h3 className="text-white uppercase font-bold font-sans">Email Support / ইমেল</h3>
                    <p className="text-sm text-gray-400 mb-4 font-bengali">বিস্তারিত তথ্যের জন্য সেরা</p>
                    <a href={`mailto:${config.contact.email}`} className="text-white font-bold hover:text-primary transition-colors font-sans">{config.contact.email}</a>
                </div>
                
                <div className="bg-dark-900 p-8 rounded-2xl border border-white/10 flex flex-col items-center text-center hover:border-green-500/50 transition-colors group shadow-lg">
                    <div className="w-16 h-16 bg-dark-950 rounded-full flex items-center justify-center mb-4 border border-white/10 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                        <i className="fab fa-whatsapp text-green-500 text-3xl"></i>
                    </div>
                    <h3 className="text-white uppercase font-bold font-sans">WhatsApp</h3>
                    <p className="text-sm text-gray-400 mb-4 font-bengali">তাৎক্ষণিক উত্তরের জন্য</p>
                    <a href={config.contact.whatsapp} target="_blank" rel="noreferrer" className="text-white font-bold hover:text-green-500 transition-colors font-sans">{config.contact.phone}</a>
                </div>
            </div>

            <div className="bg-dark-900 p-8 rounded-2xl border border-white/10 shadow-2xl max-w-3xl mx-auto">
                <h2 className="text-center text-2xl font-bold text-white mb-6 font-bengali">মেসেজ পাঠান / Send Message</h2>
                {!sent ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input 
                                required 
                                type="text" 
                                placeholder="Your Name / আপনার নাম" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-dark-950 border border-white/10 p-4 rounded-xl text-white focus:border-primary outline-none transition-colors" 
                            />
                            <input 
                                required 
                                type="email" 
                                placeholder="Your Email / আপনার ইমেল" 
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full bg-dark-950 border border-white/10 p-4 rounded-xl text-white focus:border-primary outline-none transition-colors" 
                            />
                        </div>
                        <textarea 
                            required 
                            placeholder="How can we help you? / আমরা কিভাবে সাহায্য করতে পারি?" 
                            rows={5} 
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            className="w-full bg-dark-950 border border-white/10 p-4 rounded-xl text-white focus:border-primary outline-none transition-colors"
                        ></textarea>
                        <button disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase py-4 rounded-xl shadow-glow transition-all font-sans">
                            {loading ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 text-3xl animate-bounce">
                            <i className="fas fa-check"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 font-bengali">মেসেজ পাঠানো হয়েছে!</h3>
                        <p className="text-gray-400">Our support team will get back to you within 2 hours.</p>
                        <button onClick={() => setSent(false)} className="mt-8 text-primary font-bold uppercase hover:underline text-sm">Send Another</button>
                    </div>
                )}
            </div>
        </PageContainer>
    );
};
