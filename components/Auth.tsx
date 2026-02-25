
import React, { useState } from 'react';
import { Link2Off, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '../services/supabase';

interface AuthProps {
  onLogin: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
    if (successMsg) setSuccessMsg(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        // --- LOGIN FLOW ---
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) {
          throw signInError;
        }

        if (data.session) {
          // Check if old user to skip onboarding
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('stats')
              .eq('id', data.session.user.id)
              .single();

            if (profileData && profileData.stats) {
              localStorage.setItem('untether_onboarding_complete', 'true');
              localStorage.setItem('untether_consent', 'true');
            }
          } catch (profileErr) {
            console.error("Could not fetch profile during login:", profileErr);
          }

          onLogin();
        }
      } else {
        // --- REGISTRATION FLOW ---
        if (formData.password.length < 1) {
          throw new Error("Password cannot be empty");
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
            }
          }
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          const { error: dbError } = await supabase
            .from('profiles')
            .upsert({
              id: signUpData.user.id,
              full_name: formData.name,
              email: formData.email,
              password: formData.password
            });

          if (dbError) {
            console.error("Profile sync error:", dbError);
          }

          if (signUpData.session) {
            await supabase.auth.signOut();
          }

          setSuccessMsg("Identity Created! Your data is saved. Please login to synchronize.");
          setIsLogin(true);
          setFormData(prev => ({ ...prev, password: '' }));
        }
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.message?.includes("already registered") || err.code === "registration_disabled") {
        setError("This email is already registered. Please login instead.");
        setIsLogin(true);
      } else {
        setError(err.message || "Authentication failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-1000 relative overflow-y-auto">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--accent-glow)] blur-[150px] rounded-full opacity-20 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[150px] rounded-full opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-sm space-y-10 relative z-10 py-12">
        <div className="flex flex-col items-center gap-6">
          {/* Focused glow on icon box */}
          <div className="w-24 h-24 bg-white text-black rounded-[32px] flex items-center justify-center icon-radiant-glow animate-neon-pulse">
            <Link2Off size={48} strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-black tracking-tighter opal-gradient-text uppercase">UnTether</h1>
            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.5em] mt-3">Reclaim your reality</p>
          </div>
        </div>

        <div className="opal-card p-1 bg-white/5 rounded-[40px] border-white/5 shadow-2xl">
          <form onSubmit={handleAuth} className="p-8 space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-4">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required={!isLogin}
                  className="w-full bg-black/40 border border-white/5 rounded-[24px] px-6 py-4 text-white placeholder:text-zinc-800 focus:outline-none focus:border-[var(--accent-primary)] transition-all font-bold text-sm"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-4">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                required
                className="w-full bg-black/40 border border-white/5 rounded-[24px] px-6 py-4 text-white placeholder:text-zinc-800 focus:outline-none focus:border-[var(--accent-primary)] transition-all font-bold text-sm"
              />
            </div>

            <div className="space-y-1 relative">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-4">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
                className="w-full bg-black/40 border border-white/5 rounded-[24px] px-6 py-4 text-white placeholder:text-zinc-800 focus:outline-none focus:border-[var(--accent-primary)] transition-all font-bold text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 bottom-4 text-zinc-700 hover:text-zinc-400 p-2"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-rose-500 bg-rose-500/5 border border-rose-500/10 px-4 py-3 rounded-2xl text-[10px] font-bold leading-tight animate-in slide-in-from-top-2 mt-2">
                {/* Fixed: Use local AlertCircle component below */}
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2 text-emerald-400 bg-emerald-400/5 border border-emerald-400/10 px-4 py-3 rounded-2xl text-[10px] font-bold leading-tight animate-in slide-in-from-top-2 mt-2">
                <CheckCircle2 size={14} className="shrink-0" />
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-5 bg-white text-black rounded-[28px] font-black text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-3 hover:bg-[var(--accent-primary)] hover:shadow-[0_0_25px_var(--accent-glow)] transition-all active:scale-95 disabled:opacity-50 group"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Synchronize' : 'Register Profile'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccessMsg(null);
            }}
            className="text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-[var(--accent-primary)] transition-colors"
          >
            {isLogin ? "New user? Create an Identity" : "Already have an Identity? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom AlertCircle component - kept this and removed from lucide-react import above to fix conflict.
const AlertCircle = ({ size, className }: { size: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
