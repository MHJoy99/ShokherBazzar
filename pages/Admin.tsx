
import React, { useState } from 'react';
import { api } from '../lib/api';

export const Admin: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    const checkConnection = async () => {
        setStatus('checking');
        try {
            const products = await api.getProducts();
            if (products.length > 0 && products[0].id !== 115) { 
                 setStatus('success');
                 setMsg(`Success! Found ${products.length} products from WooCommerce.`);
            } else {
                 setStatus('error');
                 setMsg('Connection Failed: The API returned Mock Data. Check CORS or Keys.');
            }
        } catch (e) {
            setStatus('error');
            setMsg('Connection Failed: Network Error.');
        }
    };

    return (
        <div className="min-h-screen bg-dark-950 p-12 flex items-center justify-center">
            <div className="max-w-md w-full bg-dark-900 border border-white/10 rounded-2xl p-8 text-center">
                <h1 className="text-3xl text-white font-bold mb-4">Admin Diagnostics</h1>
                <p className="text-gray-400 mb-8">Use this tool to verify your WooCommerce API connection.</p>
                <button onClick={checkConnection} disabled={status === 'checking'} className="bg-primary hover:bg-primary-hover text-black font-bold py-3 px-6 rounded-lg uppercase tracking-wider mb-6 w-full">
                    {status === 'checking' ? 'Testing Connection...' : 'Test WooCommerce Connection'}
                </button>
                {status === 'success' && <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400"><i className="fas fa-check-circle text-2xl mb-2"></i><p>{msg}</p></div>}
                {status === 'error' && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400"><i className="fas fa-exclamation-triangle text-2xl mb-2"></i><p>{msg}</p></div>}
            </div>
        </div>
    )
}
