
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Core Imports (Keep vital components eager for LCP)
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { SkeletonHero } from './components/Skeleton';
import { WhatsAppFloat } from './components/WhatsAppFloat';
import { ScrollToTop } from './components/ScrollToTop';

// Lazy Load Pages to reduce bundle size
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then(module => ({ default: module.ProductDetail })));
const Cart = lazy(() => import('./pages/Cart').then(module => ({ default: module.Cart })));
const CategoryPage = lazy(() => import('./pages/CategoryPage').then(module => ({ default: module.CategoryPage })));
const Admin = lazy(() => import('./pages/Admin').then(module => ({ default: module.Admin })));
const NotFound = lazy(() => import('./pages/NotFound').then(module => ({ default: module.NotFound })));
const DynamicPage = lazy(() => import('./pages/DynamicPage').then(module => ({ default: module.DynamicPage })));
const TrackOrder = lazy(() => import('./pages/TrackOrder').then(module => ({ default: module.TrackOrder }))); // NEW

// Lazy load Auth & Static pages which export multiple components
const AuthPages = import('./pages/AuthPages');
const LoginPage = lazy(() => AuthPages.then(module => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => AuthPages.then(module => ({ default: module.DashboardPage })));

const StaticPages = import('./pages/StaticPages');
const AboutPage = lazy(() => StaticPages.then(module => ({ default: module.AboutPage })));
const ContactPage = lazy(() => StaticPages.then(module => ({ default: module.ContactPage })));
const TermsPage = lazy(() => StaticPages.then(module => ({ default: module.TermsPage })));
const PrivacyPage = lazy(() => StaticPages.then(module => ({ default: module.PrivacyPage })));
const RefundPage = lazy(() => StaticPages.then(module => ({ default: module.RefundPage })));

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const is404 = location.pathname === '/404'; 
  return (
    <div className="flex flex-col min-h-screen bg-dark-950 text-white font-sans selection:bg-primary selection:text-white">
      {!isAdmin && !is404 && <Navbar />}
      <main className={`flex-grow ${!isAdmin && !is404 ? 'pt-16' : ''}`}>
        {children}
      </main>
      {!isAdmin && !is404 && <WhatsAppFloat />}
      {!isAdmin && !is404 && <Footer />}
    </div>
  );
};

// Simple Loading Fallback
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const App: React.FC = () => {
  return (
    <HelmetProvider>
        <ToastProvider>
        <AuthProvider>
            <CartProvider>
                <Router>
                <ScrollToTop />
                <Layout>
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/product/:slug" element={<ProductDetail />} />
                            
                            {/* Standard Category Route */}
                            <Route path="/category/:slug" element={<CategoryPage />} />
                            
                            {/* Legacy SEO Route (e.g., old WordPress links) */}
                            <Route path="/product-category/:slug" element={<CategoryPage />} />
                            
                            {/* DYNAMIC WP PAGES ROUTE */}
                            <Route path="/page/:slug" element={<DynamicPage />} />
                            
                            <Route path="/cart" element={<Cart />} />
                            <Route path="/admin" element={<Admin />} />
                            
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/track-order" element={<TrackOrder />} /> 

                            <Route path="/about" element={<AboutPage />} />
                            <Route path="/contact" element={<ContactPage />} />
                            <Route path="/terms" element={<TermsPage />} />
                            <Route path="/privacy" element={<PrivacyPage />} />
                            <Route path="/refund" element={<RefundPage />} />
                            
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </Layout>
                </Router>
            </CartProvider>
        </AuthProvider>
        </ToastProvider>
    </HelmetProvider>
  );
};

export default App;
