
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const MobileBottomNav: React.FC = () => {
    const { itemCount } = useCart();
    const { user } = useAuth();
    const location = useLocation();

    // Helper to check active state
    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="fixed bottom-0 left-0 w-full bg-dark-950/90 backdrop-blur-lg border-t border-white/10 z-[80] lg:hidden safe-area-bottom">
            <div className="grid grid-cols-4 h-16 items-center">
                {/* Home */}
                <Link to="/" className="flex flex-col items-center justify-center gap-1 group">
                    <div className={`w-10 h-8 rounded-full flex items-center justify-center transition-colors ${isActive('/') ? 'text-primary' : 'text-gray-400 group-hover:text-white'}`}>
                        <i className="fas fa-home text-lg"></i>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive('/') ? 'text-white' : 'text-gray-500'}`}>Home</span>
                </Link>

                {/* Shop (Browse) */}
                <Link to="/category/all" className="flex flex-col items-center justify-center gap-1 group">
                    <div className={`w-10 h-8 rounded-full flex items-center justify-center transition-colors ${isActive('/category/all') ? 'text-primary' : 'text-gray-400 group-hover:text-white'}`}>
                        <i className="fas fa-th-large text-lg"></i>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive('/category/all') ? 'text-white' : 'text-gray-500'}`}>Shop</span>
                </Link>

                {/* Cart */}
                <Link to="/cart" className="flex flex-col items-center justify-center gap-1 group relative">
                    <div className={`w-10 h-8 rounded-full flex items-center justify-center transition-colors ${isActive('/cart') ? 'text-primary' : 'text-gray-400 group-hover:text-white'}`}>
                        <i className="fas fa-shopping-cart text-lg"></i>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive('/cart') ? 'text-white' : 'text-gray-500'}`}>Cart</span>
                    {itemCount > 0 && (
                        <span className="absolute top-0 right-4 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-dark-950">
                            {itemCount}
                        </span>
                    )}
                </Link>

                {/* Account */}
                <Link to={user ? "/dashboard" : "/login"} className="flex flex-col items-center justify-center gap-1 group">
                    <div className={`w-10 h-8 rounded-full flex items-center justify-center transition-colors ${isActive('/dashboard') || isActive('/login') ? 'text-primary' : 'text-gray-400 group-hover:text-white'}`}>
                        {user ? (
                            <img src={user.avatar_url} alt="Profile" className="w-6 h-6 rounded-full border border-primary" />
                        ) : (
                            <i className="fas fa-user text-lg"></i>
                        )}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive('/dashboard') || isActive('/login') ? 'text-white' : 'text-gray-500'}`}>
                        {user ? 'Profile' : 'Login'}
                    </span>
                </Link>
            </div>
        </div>
    );
};
