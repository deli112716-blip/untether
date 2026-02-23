
import React from 'react';
import { View } from '../types';
import { Link2Off, Target, Activity, MapPin, Settings as SettingsIcon, Flame, BarChart3, Home } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  setView: (view: View) => void;
  streak: number;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, streak }) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'focus', label: 'Focus', icon: Target },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'geo', label: 'Zones', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[var(--accent-glow)]">
      {/* Premium Header - Hidden on Dashboard for integrated experience */}
      {currentView !== 'dashboard' && (
        <header className="sticky top-0 z-40 bg-black px-6 py-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center transition-all group-hover:scale-105">
              <Link2Off size={22} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white">
              UnTether
            </h1>
          </div>
          
          <div className="flex items-center gap-2 px-5 py-2.5 bg-[#d8b4fe]/20 border border-[#d8b4fe]/30 rounded-full shadow-[0_0_20px_rgba(216,180,254,0.15)]">
            <Flame size={14} className="text-[#d8b4fe]" fill="currentColor" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">{streak} DAY STREAK</span>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <div className="relative pb-32">
        {children}
      </div>

      {/* Modern Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-3xl border-t border-white/5 px-8 pb-10 pt-5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id as View;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as View)}
                className={`flex flex-col items-center gap-2 transition-all duration-300 active:scale-90 relative ${
                  isActive ? 'text-[#d8b4fe]' : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                <div className={`p-2.5 rounded-full transition-all duration-300 ${isActive ? 'bg-[#d8b4fe]/10 shadow-[0_0_20px_rgba(216,180,254,0.1)]' : ''}`}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {isActive && (
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-top-1">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
