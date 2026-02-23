
import React, { useState, useEffect } from 'react';
import { Shield, MapPin, Smartphone, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

interface PermissionGuardProps {
  onGranted: () => void;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ onGranted }) => {
  const [step, setStep] = useState(0);
  const [permissions, setPermissions] = useState({
    geo: false,
    notifications: false,
    screen: false
  });

  const handleGeoRequest = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissions(prev => ({ ...prev, geo: true }));
          setStep(1);
        },
        (error) => {
          console.error("Geo error:", error);
          setStep(1);
        }
      );
    } else {
      setStep(1);
    }
  };

  const handleNotificationRequest = async () => {
    if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        setPermissions(prev => ({ ...prev, notifications: permission === 'granted' }));
      } catch (e) {
        console.error("Notification request failed:", e);
      }
    }
    setStep(2);
  };

  const handleScreenRequest = () => {
    setPermissions(prev => ({ ...prev, screen: true }));
    onGranted();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-start p-8 animate-in fade-in duration-700 overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(192,132,252,0.05)_0%,transparent_70%)] pointer-events-none"></div>
      
      <div className="max-w-md w-full space-y-12 relative z-10 py-12">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center mx-auto border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <Shield className="text-white" size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Authorization</h2>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">Neural Link Initialization</p>
          </div>
        </div>

        <div className="opal-card p-10 rounded-[48px] border-white/5 space-y-10">
          {step === 0 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex gap-6">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 text-[var(--accent-blue)]">
                  <MapPin size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-white font-black text-lg italic uppercase tracking-tight">Spatial Awareness</h3>
                  <p className="text-zinc-500 text-xs font-bold leading-relaxed">
                    Required to enforce GeoFence jurisdictions and trigger suppression matrix when entering restricted zones.
                  </p>
                </div>
              </div>
              <button 
                onClick={handleGeoRequest}
                className="w-full py-6 bg-white text-black rounded-[32px] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                GRANT SPATIAL ACCESS <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex gap-6">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 text-[var(--accent-purple)]">
                  <Shield size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-white font-black text-lg italic uppercase tracking-tight">Neural Alerts</h3>
                  <p className="text-zinc-500 text-xs font-bold leading-relaxed">
                    Enables the system to send deterrent notifications and protocol updates directly to your consciousness.
                  </p>
                </div>
              </div>
              <button 
                onClick={handleNotificationRequest}
                className="w-full py-6 bg-white text-black rounded-[32px] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                ENABLE NOTIFICATIONS <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex gap-6">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 text-emerald-400">
                  <Smartphone size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-white font-black text-lg italic uppercase tracking-tight">Temporal Tracking</h3>
                  <p className="text-zinc-500 text-xs font-bold leading-relaxed">
                    Allows the system to monitor digital consumption and calculate your "Time Reclaimed" metrics in real-time.
                  </p>
                </div>
              </div>
              <button 
                onClick={handleScreenRequest}
                className="w-full py-6 bg-white text-black rounded-[32px] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                AUTHORIZE TRACKING <CheckCircle2 size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 opacity-20">
          <div className={`w-2 h-2 rounded-full ${permissions.geo ? 'bg-white' : 'bg-zinc-800'}`}></div>
          <div className={`w-2 h-2 rounded-full ${permissions.notifications ? 'bg-white' : 'bg-zinc-800'}`}></div>
          <div className={`w-2 h-2 rounded-full ${permissions.screen ? 'bg-white' : 'bg-zinc-800'}`}></div>
        </div>
      </div>
    </div>
  );
};
