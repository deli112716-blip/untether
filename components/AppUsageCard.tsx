
import React from 'react';

interface AppUsageCardProps {
  name: string;
  time: number;
  scrollCount?: number;
  color: string;
}

export const AppUsageCard: React.FC<AppUsageCardProps> = ({ name, time, scrollCount, color }) => {
  const hours = Math.floor(time / 60);
  const minutes = time % 60;

  return (
    <div className="opal-card p-6 rounded-[36px] flex items-center justify-between group transition-all duration-500 overflow-hidden relative border-white/5 hover:border-[var(--accent-primary)]">
      {/* Dynamic Background Hover Effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-white/[0.03] group-hover:to-[var(--accent-glow)] opacity-0 group-hover:opacity-10 transition-all duration-700 pointer-events-none"
      ></div>
      
      <div className="flex items-center gap-5 relative z-10">
        <div className="w-14 h-14 rounded-[22px] flex items-center justify-center bg-black border border-white/5 group-hover:border-[var(--accent-primary)] transition-all duration-700 shadow-inner">
           <div 
             className="w-3.5 h-3.5 rounded-full transition-all duration-700 group-hover:scale-150 group-hover:shadow-[0_0_20px_currentColor] group-hover:animate-pulse" 
             style={{ backgroundColor: color, color: color }}
           ></div>
        </div>
        <div>
          <h4 className="font-bold text-xl tracking-tight text-white group-hover:translate-x-1.5 transition-transform duration-500">{name}</h4>
          <p className="text-[11px] text-zinc-600 font-black uppercase tracking-widest mt-0.5">
            {hours > 0 ? `${hours}H ` : ''}{minutes}M RECORDED
          </p>
        </div>
      </div>
      
      {scrollCount && (
        <div className="text-right relative z-10">
           <div className="text-2xl font-black text-white tabular-nums group-hover:text-[var(--accent-primary)] transition-colors duration-500 drop-shadow-sm">
             {scrollCount}
           </div>
           <div className="text-[11px] font-black text-zinc-600 uppercase tracking-tighter mt-0.5">Scrolls</div>
        </div>
      )}
    </div>
  );
};
