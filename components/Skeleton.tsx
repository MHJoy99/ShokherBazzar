
import React from 'react';

export const SkeletonCard: React.FC = () => (
  <div className="bg-dark-900 rounded-xl overflow-hidden border border-white/5 h-full flex flex-col shadow-lg animate-pulse">
      <div className="aspect-[3/4] bg-white/5"></div>
      <div className="p-5 flex flex-col flex-grow">
          <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
          <div className="mt-auto flex justify-between items-end border-t border-white/5 pt-3">
              <div className="w-16 h-6 bg-white/10 rounded"></div>
              <div className="w-10 h-10 bg-white/5 rounded-xl"></div>
          </div>
      </div>
  </div>
);

export const SkeletonHero: React.FC = () => (
    <div className="h-[600px] w-full bg-dark-950 border-b border-white/5 animate-pulse relative">
        <div className="max-w-7xl mx-auto px-4 h-full flex flex-col justify-center">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                <div className="md:col-span-7 space-y-6">
                    <div className="h-4 w-32 bg-white/5 rounded"></div>
                    <div className="h-20 w-3/4 bg-white/5 rounded"></div>
                    <div className="h-6 w-1/2 bg-white/5 rounded"></div>
                    <div className="h-14 w-48 bg-white/5 rounded-xl mt-4"></div>
                </div>
                <div className="hidden md:block md:col-span-5">
                    <div className="w-[340px] h-[480px] mx-auto bg-white/5 rounded-2xl"></div>
                </div>
            </div>
        </div>
    </div>
);
