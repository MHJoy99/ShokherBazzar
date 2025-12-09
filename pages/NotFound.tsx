
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { config } from '../config';

export const NotFound: React.FC = () => (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
        <Helmet><title>Page Not Found | {config.siteName}</title></Helmet>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
        <div className="relative z-10 text-center max-w-lg">
            <h1 className="text-9xl font-black text-white opacity-10 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150">404</h1>
            <div className="w-24 h-24 bg-dark-900 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-primary shadow-glow relative z-20">
                 <i className="fas fa-ghost text-4xl text-primary animate-float"></i>
            </div>
            <h2 className="text-4xl font-black text-white uppercase italic mb-4 relative z-20">Game Over</h2>
            <p className="text-gray-400 mb-8 relative z-20">The page you are looking for has been moved, deleted, or possibly never existed.</p>
            <Link to="/" className="inline-block bg-primary hover:bg-primary-hover text-black font-black uppercase py-3 px-8 rounded-xl shadow-glow transition-all relative z-20">Respawn Home</Link>
        </div>
    </div>
);
