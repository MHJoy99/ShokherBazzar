
import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Modular Imports
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Admin } from './pages/Admin';
import { CategoryPage } from './pages/CategoryPage';
import { LoginPage, DashboardPage } from './pages/AuthPages';
import { AboutPage, ContactPage, TermsPage, PrivacyPage, RefundPage } from './pages/StaticPages';
import { NotFound } from './pages/NotFound';

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
      {!isAdmin && !is404 && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
        <ToastProvider>
        <AuthProvider>
            <CartProvider>
                <Router>
                <Layout>
                    <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/category/:slug" element={<CategoryPage />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/admin" element={<Admin />} />
                    
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />

                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/refund" element={<RefundPage />} />
                    
                    <Route path="*" element={<NotFound />} />
                    </Routes>
                </Layout>
                </Router>
            </CartProvider>
        </AuthProvider>
        </ToastProvider>
    </HelmetProvider>
  );
};

export default App;
