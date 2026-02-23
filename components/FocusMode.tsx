
import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Sparkles, Shield, CheckCircle2, VolumeX, CloudRain, Wind, MessageSquareQuote, PenTool, EyeOff, Link2Off, Flame, Smartphone, Globe, ToggleLeft, ToggleRight, Lock, Target } from 'lucide-react';
import { generateWarningMessage, getReflectionQuestion, speakWarning } from '../services/gemini';
import { WarningConfig, BlockableApp } from '../types';

interface FocusModeProps {
  isActive: boolean;
  onToggle: () => void;
  onComplete: (minutes: number, entry?: { question: string, answer: string, reason?: string }) => void;
  warningConfig: WarningConfig;
  streak: number;
  apps: BlockableApp[];
  toggleApp: (id: string) => void;
}

type Soundscape = 'none' | 'rain' | 'zen';

const SOUNDS: Record<string, string> = {
  rain: 'https://assets.mixkit.co/active_storage/sfx/2431/2431-preview.mp3',
  zen: 'https://assets.mixkit.co/active_storage/sfx/2433/2433-preview.mp3'
};

export const FocusMode: React.FC<FocusModeProps> = ({ isActive, onToggle, onComplete, warningConfig, streak, apps, toggleApp }) => {
  const initialTime = 25 * 60;
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [showWarning, setShowWarning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [reflection, setReflection] = useState('');
  const [answer, setAnswer] = useState('');
  const [reason, setReason] = useState('');
  const [isLoadingWarning, setIsLoadingWarning] = useState(false);
  const [soundscape, setSoundscape] = useState<Soundscape>('none');
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');
  
  const [isSaving, setIsSaving] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio Management
  useEffect(() => {
    if (isActive && soundscape !== 'none') {
      const playAudio = async () => {
        if (!audioRef.current) {
          try {
            audioRef.current = new Audio(SOUNDS[soundscape]);
            audioRef.current.loop = true;
            audioRef.current.preload = 'auto';
          } catch (e) {
            console.warn("Audio constructor failed:", e);
            return;
          }
        } else {
          audioRef.current.src = SOUNDS[soundscape];
        }

        try {
          await audioRef.current.play();
        } catch (e) {
          console.error("Audio playback blocked or failed:", e);
        }
      };

      playAudio();
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isActive, soundscape]);

  // Breathing Pacer Logic for Zen Mode
  useEffect(() => {
    if (isActive && soundscape === 'zen') {
      const breathInterval = setInterval(() => {
        setBreathPhase(prev => prev === 'inhale' ? 'exhale' : 'inhale');
      }, 4000); // 4 seconds inhale, 4 seconds exhale
      return () => clearInterval(breathInterval);
    }
  }, [isActive, soundscape]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleFinished();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleFinished = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const question = await getReflectionQuestion();
    setReflection(question);
    onToggle();
    setShowSuccess(true);
  };

  const handleSaveReflection = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const minutesSaved = Math.floor((initialTime - timeLeft) / 60);
      onComplete(minutesSaved > 0 ? minutesSaved : 1, { 
        question: reflection, 
        answer: answer,
        reason: reason 
      });
      setShowSuccess(false);
      setTimeLeft(initialTime);
      setAnswer('');
      setReason('');
    } catch (e) {
      console.error("Failed to save reflection:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStopAttempt = async () => {
    setIsLoadingWarning(true);
    try {
      const msg = await generateWarningMessage("Digital World", "Focus Session");
      if (msg) {
        setWarningMsg(msg);
        setIsLoadingWarning(false);
        setShowWarning(true);
        
        const voice = localStorage.getItem('untether_persona_voice') || 'Charon';
        speakWarning(msg, voice);
      } else {
        throw new Error("No message generated");
      }
    } catch (e) {
      setIsLoadingWarning(false);
      setShowWarning(true);
      setWarningMsg("Presence is a gift. Don't discard it yet.");
    }
  };

  const renderVisualEnvironment = () => {
    if (!isActive) return null;
    
    if (soundscape === 'rain') {
      return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black/40">
           {/* Multi-layered rain */}
           {Array.from({ length: 60 }).map((_, i) => (
             <div 
               key={i} 
               className="absolute bg-sky-300 w-[1px] h-10 rounded-full animate-rain"
               style={{ 
                 left: `${Math.random() * 100}%`, 
                 top: `-${Math.random() * 100}%`,
                 opacity: 0.1 + Math.random() * 0.4,
                 animationDelay: `${Math.random() * 2}s`,
                 animationDuration: `${0.5 + Math.random() * 0.3}s`
               }}
             />
           ))}
        </div>
      );
    }

    if (soundscape === 'zen') {
      return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-emerald-950/80 via-black to-emerald-950/40">
           {/* Floating Zen Particles - Enhanced */}
           {Array.from({ length: 60 }).map((_, i) => (
             <div 
               key={i} 
               className="absolute bg-emerald-400/30 w-64 h-64 rounded-full blur-[120px] animate-float"
               style={{ 
                 left: `${Math.random() * 100}%`, 
                 top: `${Math.random() * 100}%`,
                 animationDelay: `${Math.random() * 10}s`,
                 animationDuration: `${25 + Math.random() * 20}s`,
                 transform: `scale(${0.3 + Math.random() * 1.5})`,
                 opacity: 0.05 + Math.random() * 0.15
               }}
             />
           ))}
           
           {/* Zen Mist */}
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1)_0%,transparent_80%)] animate-pulse duration-[8000ms]"></div>
           
           {/* Zen Ripples */}
           <div className="absolute inset-0 flex items-center justify-center">
              {[1, 2, 3, 4].map((r) => (
                <div 
                  key={r}
                  className="absolute border border-emerald-500/5 rounded-full animate-ping"
                  style={{ 
                    width: `${r * 300}px`, 
                    height: `${r * 300}px`,
                    animationDuration: '12s',
                    animationDelay: `${r * 3}s`
                  }}
                />
              ))}
           </div>

           {/* Breathing Pacer Ring - Enhanced */}
           <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="relative flex items-center justify-center"
                style={{ 
                  width: breathPhase === 'inhale' ? '550px' : '220px',
                  height: breathPhase === 'inhale' ? '550px' : '220px',
                  transition: 'all 4000ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div className="absolute inset-0 border-[1px] border-emerald-500/20 rounded-full shadow-[0_0_100px_rgba(52,211,153,0.1)]" />
                <div className="absolute inset-8 border-[0.5px] border-emerald-500/10 rounded-full" />
                <div className="absolute inset-16 border-[0.5px] border-emerald-500/5 rounded-full" />
                
                {/* Inner Glow */}
                <div 
                  className="absolute inset-0 rounded-full bg-emerald-500/5 blur-3xl transition-opacity duration-[4000ms]"
                  style={{ opacity: breathPhase === 'inhale' ? 0.6 : 0.2 }}
                />
              </div>

              <div className="absolute flex flex-col items-center gap-6 mt-[600px]">
                <div className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full transition-all duration-1000 ${breathPhase === 'inhale' ? 'bg-emerald-400 scale-150 shadow-[0_0_15px_#34d399]' : 'bg-zinc-900'}`} />
                  <div className={`w-2 h-2 rounded-full transition-all duration-1000 ${breathPhase === 'exhale' ? 'bg-emerald-400 scale-150 shadow-[0_0_15px_#34d399]' : 'bg-zinc-900'}`} />
                </div>
                <div className="text-emerald-500/60 text-[12px] font-black uppercase tracking-[1.5em] transition-opacity duration-1000 italic">
                  {breathPhase === 'inhale' ? 'Expand' : 'Release'}
                </div>
              </div>
           </div>
        </div>
      );
    }

    if (soundscape === 'none') {
      return (
        <div className="fixed inset-0 pointer-events-none z-0 bg-black flex items-center justify-center">
           <div className="w-[1px] h-[30vh] bg-gradient-to-b from-transparent via-white/5 to-transparent animate-pulse"></div>
        </div>
      );
    }

    return null;
  };

  const renderSetupUI = () => {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-500 overflow-y-auto">
        <div className="max-w-md w-full space-y-8 py-12">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/10 mb-4">
              <Shield className="text-[var(--accent-primary)]" size={32} />
            </div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">Registry Lockdown</h2>
            <p className="text-zinc-500 font-bold text-[10px] tracking-[0.4em] uppercase">Select suppressions for this session</p>
          </div>

          <div className="opal-card rounded-[40px] border-white/10 overflow-hidden max-h-[45vh] overflow-y-auto custom-scrollbar">
            <div className="divide-y divide-white/5">
              {apps.map(app => (
                <div key={app.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-black border border-white/5 flex items-center justify-center">
                      {app.category === 'Website' ? <Globe size={18} className="text-zinc-600" /> : <Smartphone size={18} className="text-zinc-600" />}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{app.name}</div>
                      <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{app.category}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleApp(app.id)}
                    className={`p-2 rounded-xl transition-all ${app.blocked ? 'text-rose-500 bg-rose-500/10' : 'text-zinc-700 bg-white/5'}`}
                  >
                    {app.blocked ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => { setShowSetup(false); onToggle(); }}
              className="w-full py-6 bg-white text-black rounded-[32px] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
            >
              ENGAGE LOCKDOWN
            </button>
            <button 
              onClick={() => setShowSetup(false)}
              className="text-zinc-600 font-bold hover:text-white text-[10px] uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderWarningUI = () => {
    const isAggressive = warningConfig.layout === 'aggressive';
    const isImmersive = warningConfig.layout === 'immersive';
    
    return (
      <div 
        className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500`}
      >
        <div 
          className="absolute inset-0 transition-opacity duration-1000 pointer-events-none" 
          style={{ 
            background: `radial-gradient(circle at center, ${warningConfig.color}20 0%, transparent 70%)`,
            opacity: warningConfig.intensity / 100
          }}
        />
        
        <div className={`max-w-md w-full space-y-12 relative z-10 ${isAggressive ? 'animate-pulse' : ''}`}>
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto border"
            style={{ 
              backgroundColor: `${warningConfig.color}10`, 
              color: warningConfig.color,
              borderColor: `${warningConfig.color}40`,
              boxShadow: `0 0 ${warningConfig.intensity / 2}px ${warningConfig.color}40`
            }}
          >
            <Shield size={48} />
          </div>
          
          <h2 
            className="font-black tracking-tight leading-tight italic px-4 transition-all"
            style={{ 
              color: 'white', 
              fontSize: `${warningConfig.textScale * 1.5}rem`,
              textShadow: isImmersive ? `0 0 15px ${warningConfig.color}80` : 'none'
            }}
          >
            "{warningMsg}"
          </h2>
          
          <div className="pt-8 flex flex-col gap-5">
            <button 
              onClick={() => setShowWarning(false)}
              className="w-full py-6 rounded-[32px] font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl"
              style={{ backgroundColor: 'white', color: 'black' }}
            >
              RESUME FOCUS
            </button>
            <button 
              onClick={() => { 
                const minutesSaved = Math.floor((initialTime - timeLeft) / 60);
                if (minutesSaved > 0) onComplete(minutesSaved);
                setShowWarning(false); 
                onToggle(); 
                setTimeLeft(initialTime); 
              }}
              className="text-zinc-600 font-bold hover:text-white text-[10px] uppercase tracking-widest transition-colors"
            >
              Break the streak anyway
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto py-12 flex flex-col items-center gap-12 animate-in fade-in duration-1000 px-4 relative min-h-[70vh] justify-center">
      {/* Background Environment Effects */}
      {renderVisualEnvironment()}

      {/* Warning Overlay */}
      {showWarning && renderWarningUI()}

      {/* Setup Overlay */}
      {showSetup && renderSetupUI()}

      {/* Success & Reflection Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500">
          <div className="max-w-md w-full space-y-10">
            <div className="w-20 h-20 bg-emerald-600/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">Protocol Achieved</h2>
                <p className="text-zinc-500 font-bold text-[10px] tracking-[0.4em] uppercase">Digital detox entry recorded</p>
              </div>
              
              <div className="p-8 opal-card bg-white/5 border-white/10 rounded-[40px] text-left space-y-6 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 text-white/5 group-hover:text-[var(--accent-primary)]/10 transition-colors">
                  <MessageSquareQuote size={60} />
                </div>
                <div className="space-y-2 relative z-10">
                  <span className="text-[9px] font-black uppercase text-[var(--accent-primary)] tracking-widest">Insight Prompt</span>
                  <p className="text-xl font-bold text-white leading-relaxed italic">
                    {reflection}
                  </p>
                </div>
                
                <div className="space-y-3 relative z-10">
                   <div className="flex items-center gap-2 text-[9px] font-black uppercase text-zinc-500 tracking-widest ml-1">
                     <Target size={10} /> Session Purpose
                   </div>
                   <input 
                     type="text"
                     value={reason}
                     onChange={(e) => setReason(e.target.value)}
                     className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                     placeholder="What was this time used for? (e.g. Deep Work, Reading)"
                   />
                </div>

                <div className="space-y-3 relative z-10">
                   <div className="flex items-center gap-2 text-[9px] font-black uppercase text-zinc-500 tracking-widest ml-1">
                     <PenTool size={10} /> Your Reflection
                   </div>
                   <textarea 
                     value={answer}
                     onChange={(e) => setAnswer(e.target.value)}
                     className="w-full bg-black border border-white/10 rounded-3xl p-5 text-sm font-bold text-white focus:outline-none focus:border-[var(--accent-primary)] transition-all resize-none shadow-inner h-24"
                     placeholder="Type your realization here..."
                   />
                </div>
              </div>
            </div>
            <button 
              onClick={handleSaveReflection}
              disabled={isSaving}
              className={`w-full py-6 bg-[var(--accent-primary)] text-black rounded-[32px] font-black uppercase tracking-widest text-xs shadow-[0_0_40px_var(--accent-glow)] active:scale-95 transition-all flex items-center justify-center gap-3 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
              {isSaving ? 'RECORDING...' : 'COMMIT TO MEMORY'}
            </button>
          </div>
        </div>
      )}

      {/* Timer Display */}
      <div className={`relative group z-10 transition-all duration-1000 ${isActive && soundscape === 'none' ? 'scale-110' : 'scale-100'}`}>
        <div className={`absolute -inset-24 bg-[#d8b4fe] opacity-5 rounded-full blur-[120px] transition-all duration-1000 ${isActive ? 'opacity-10 scale-110' : 'opacity-0 scale-90'}`}></div>
        
        {/* Zen Pulse Rings */}
        {isActive && soundscape === 'zen' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-full h-full border border-emerald-500/20 rounded-full animate-ping duration-[4000ms]" />
            <div className="absolute w-full h-full border border-emerald-500/10 rounded-full animate-ping duration-[6000ms] delay-1000" />
          </div>
        )}

        <div className={`relative w-[340px] h-[340px] md:w-[420px] md:h-[420px] rounded-full border-[1px] ${isActive ? (soundscape === 'zen' ? 'border-emerald-500/40 shadow-[0_0_80px_rgba(16,185,129,0.2)]' : 'border-[#d8b4fe]/40 shadow-[0_0_100px_rgba(216,180,254,0.1)]') : 'border-white/5'} flex flex-col items-center justify-center transition-all duration-[1500ms] bg-black`}>
           <div className={`text-[9px] font-black uppercase tracking-[0.5em] mb-6 transition-all duration-700 ${isActive ? 'text-[#d8b4fe]' : 'text-zinc-700'} ${isActive && soundscape === 'none' ? 'opacity-0' : 'opacity-100'}`}>
             {isActive ? 'SESSION LOCK' : 'INITIATOR'}
           </div>
           <div className={`text-[100px] md:text-[130px] font-black tracking-tighter tabular-nums transition-all duration-700 ${isActive ? 'text-white' : 'text-zinc-800'}`}>
            {formatTime(timeLeft)}
           </div>
           {isActive && soundscape === 'zen' && (
             <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
               <Wind size={180} className="animate-pulse" />
             </div>
           )}
           {isActive && soundscape !== 'none' && (
             <div className="mt-6 flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 animate-pulse transition-opacity duration-1000">
               <div className="w-1.5 h-1.5 bg-[#d8b4fe] rounded-full"></div>
               <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Active Protocol</span>
             </div>
           )}
        </div>
      </div>

      {/* UI Elements */}
      <div className={`flex flex-col items-center gap-8 w-full z-10 transition-all duration-1000`}>
        <div className={`flex items-center gap-3 p-2 bg-white/5 rounded-[32px] border border-white/5 backdrop-blur-xl transition-opacity duration-1000 ${isActive && soundscape === 'none' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <SoundOption active={soundscape === 'none'} onClick={() => setSoundscape('none')} icon={<VolumeX size={18} />} label="Silence" />
          <SoundOption active={soundscape === 'rain'} onClick={() => setSoundscape('rain')} icon={<CloudRain size={18} />} label="Rain" />
          <SoundOption active={soundscape === 'zen'} onClick={() => setSoundscape('zen')} icon={<Wind size={18} />} label="Zen" />
        </div>

        {!isActive ? (
          <button 
            onClick={() => setShowSetup(true)}
            className="w-full py-7 bg-white text-black rounded-[36px] font-black text-sm tracking-widest shadow-[0_10px_40px_rgba(255,255,255,0.1)] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase hover:bg-[var(--accent-primary)] hover:shadow-[0_0_30px_var(--accent-glow)]"
          >
            <Play size={20} fill="currentColor" />
            BEGIN DEEP WORK
          </button>
        ) : (
          <button 
            onClick={handleStopAttempt}
            disabled={isLoadingWarning}
            className="w-full py-7 bg-black text-zinc-500 rounded-[36px] font-black text-sm tracking-widest border border-white/10 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase hover:border-[var(--accent-primary)]/40 group"
          >
            {isLoadingWarning ? (
              <Sparkles size={20} className="animate-spin text-[var(--accent-primary)]" />
            ) : (
              <Square size={20} className="group-hover:text-white transition-colors" fill="currentColor" />
            )}
            ABORT MISSION
          </button>
        )}
        
        {isActive ? (
          <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center gap-3 px-5 py-2 bg-white/5 rounded-full border border-white/5">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse"></div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Untethering...</span>
            </div>

            {apps.filter(a => a.blocked).length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 max-w-xs">
                {apps.filter(a => a.blocked).map(app => (
                  <div key={app.id} className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full">
                    <Lock size={10} className="text-rose-500" />
                    <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">{app.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-zinc-800 text-[9px] font-black text-center uppercase tracking-[0.4em] leading-relaxed max-w-[280px]">
            By starting, you commit to presence beyond the digital lens.
          </p>
        )}
      </div>

      {/* Minimal Escape button for Silence protocol */}
      {isActive && soundscape === 'none' && (
        <button 
          onClick={handleStopAttempt}
          className="fixed bottom-12 opacity-5 hover:opacity-100 transition-opacity text-[10px] font-black uppercase tracking-[0.5em] text-white flex items-center gap-2 group z-50"
        >
          <EyeOff size={14} className="group-hover:animate-pulse" />
          Terminate Stillness
        </button>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        @keyframes rain {
          from { transform: translateY(-100px); opacity: 0; }
          50% { opacity: 1; }
          to { transform: translateY(100vh); opacity: 0; }
        }
        .animate-rain {
          animation: rain linear infinite;
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -50px); }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

const SoundOption: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 rounded-[24px] transition-all active:scale-90 ${active ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-600 hover:text-zinc-400'}`}
  >
    {icon}
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);
