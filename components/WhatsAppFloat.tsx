
import React from 'react';
import { config } from '../config';

export const WhatsAppFloat: React.FC = () => {
  return (
    <a 
      href={config.contact.whatsapp}
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-20 right-6 z-[90] w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-glow hover:scale-110 transition-transform hover:bg-green-400 group"
      aria-label="Chat on WhatsApp"
    >
      <i className="fab fa-whatsapp text-white text-3xl"></i>
      <div className="absolute right-full mr-4 bg-white text-black text-xs font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none">
        Chat with us!
      </div>
    </a>
  );
};
