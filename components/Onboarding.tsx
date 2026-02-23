
import React, { useState } from 'react';
import { Shield, Target, MapPin, Zap, ArrowRight, CheckCircle2, Link2Off, BrainCircuit, Timer } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: "Neural Link",
      subtitle: "The Core Protocol",
      desc: "UnTether is a cognitive sovereignty system designed to reclaim your presence from digital fragmentation.",
      icon: <Link2Off size={48} className="text-white" />,
      color: "var(--accent-purple)"
    },
    {
      title: "Suppression Matrix",
      subtitle: "Registry Lockdown",
      desc: "Select the digital distractions you wish to suppress. Once engaged, the system enforces a strict protocol of silence.",
      icon: <Shield size={48} className="text-[var(--accent-blue)]" />,
      color: "var(--accent-blue)"
    },
    {
      title: "Jurisdictions",
      subtitle: "Geographic Focus",
      desc: "Define physical zones where digital consumption is strictly prohibited. The system monitors your spatial awareness in real-time.",
      icon: <MapPin size={48} className="text-emerald-400" />,
      color: "#10b981"
    },
    {
      title: "Identity Log",
      subtitle: "Cognitive Realizations",
      desc: "After each session, record your insights. This archive serves as a testament to your reclaimed sovereignty.",
      icon: <BrainCircuit size={48} className="text-amber-400" />,
      color: "#fbbf24"
    }
  ];

  const next = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('untether_onboarding_complete', 'true');
      onComplete();
    }
  };

  const current = slides[step];

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-start p-8 animate-in fade-in duration-700 overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none"></div>
      
      <div className="max-w-md w-full space-y-12 relative z-10 py-12">
        <div className="text-center space-y-6">
          <div 
            className="w-24 h-24 rounded-[40px] bg-white/5 flex items-center justify-center mx-auto border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500"
            style={{ boxShadow: `0 0 40px ${current.color}15` }}
          >
            {current.icon}
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{current.title}</h2>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">{current.subtitle}</p>
          </div>
        </div>

        <div className="opal-card p-10 rounded-[48px] border-white/5 text-center space-y-8">
          <p className="text-zinc-400 text-base font-bold leading-relaxed italic">
            "{current.desc}"
          </p>

          <button 
            onClick={next}
            className="w-full py-6 bg-white text-black rounded-[32px] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {step === slides.length - 1 ? 'INITIALIZE SYSTEM' : 'NEXT PROTOCOL'} <ArrowRight size={16} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 opacity-20">
          {slides.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${i === step ? 'bg-white scale-125' : 'bg-zinc-800'}`}></div>
          ))}
        </div>
      </div>
    </div>
  );
};
