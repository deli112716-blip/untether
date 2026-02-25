
import React, { useState, useEffect } from 'react';
import {
  Smartphone, Shield, Bell, ChevronRight,
  LogOut, ArrowLeft, Search, ToggleLeft, ToggleRight,
  Info, Sparkles, BookText, Calendar,
  Brain, Moon, Volume2, Palette, Sliders, LayoutDashboard, Monitor, Maximize, PlayCircle,
  Copy, Check, MessageSquareQuote, Trash2, MapPin, Lock, Target, PenTool, Download
} from 'lucide-react';
import { BlockableApp, ReflectionEntry, WarningConfig } from '../types';
import { speakWarning } from '../services/gemini';

interface SettingsProps {
  onLogout: () => void;
  apps: BlockableApp[];
  setApps: React.Dispatch<React.SetStateAction<BlockableApp[]>>;
  journal: ReflectionEntry[];
  onAddJournalEntry?: (entry: ReflectionEntry) => void;
  warningConfig: WarningConfig;
  setWarningConfig: (config: WarningConfig) => void;
  onBack?: () => void;
  initialView?: SettingsView;
}

type SettingsView = 'main' | 'blocker' | 'warning' | 'journal' | 'banner';

export const Settings: React.FC<SettingsProps> = ({ onLogout, apps, setApps, journal: initialJournal, onAddJournalEntry, warningConfig, setWarningConfig, onBack, initialView = 'main' }) => {
  const [view, setView] = useState<SettingsView>(initialView);
  const [searchQuery, setSearchQuery] = useState('');
  const [journalSearchQuery, setJournalSearchQuery] = useState('');
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newEntryText, setNewEntryText] = useState('');
  const [newEntryReason, setNewEntryReason] = useState('Boredom');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [warningStyle, setWarningStyle] = useState(() => {
    const saved = localStorage.getItem('untether_warning_style');
    return saved || 'The Stoic';
  });

  const [newWebsite, setNewWebsite] = useState('');

  const handleAddWebsite = () => {
    if (!newWebsite.trim()) return;
    const id = Date.now().toString();
    const newItem: BlockableApp = {
      id,
      name: newWebsite.trim().toLowerCase(),
      category: 'Website',
      blocked: true,
      iconColor: `hsl(${Math.random() * 360}, 70%, 50%)`
    };
    setApps(prev => [...prev, newItem]);
    setNewWebsite('');
  };

  const personas = [
    { id: 'stern', name: 'The Stoic', desc: 'Poetic, stern, philosophical', icon: <Shield size={18} />, voice: 'Charon', preview: "Presence is a choice. The screen is a ghost." },
    { id: 'zen', name: 'Zen Master', desc: 'Calm, gentle, mindful', icon: <Moon size={18} />, voice: 'Kore', preview: "Breathe. The digital world can wait for your spirit to return." },
    { id: 'hype', name: 'Life Coach', desc: 'High energy, motivational', icon: <Sparkles size={18} />, voice: 'Puck', preview: "You've got this! Reclaim your day, right now!" },
    { id: 'cyber', name: 'The System', desc: 'Cold, futuristic, analytical', icon: <Brain size={18} />, voice: 'Fenrir', preview: "Protocol override active. Digital consumption limit reached." },
  ];

  const handlePersonaSelect = async (persona: any) => {
    setWarningStyle(persona.name);
    localStorage.setItem('untether_warning_style', persona.name);
    localStorage.setItem('untether_persona_voice', persona.voice);

    setIsSpeaking(persona.id);
    await speakWarning(persona.preview, persona.voice);
    setIsSpeaking(null);
  };

  const toggleApp = (id: string) => {
    setApps(apps.map(app => app.id === id ? { ...app, blocked: !app.blocked } : app));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredApps = (apps || []).filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredJournal = (initialJournal || []).filter(entry =>
    entry.question.toLowerCase().includes(journalSearchQuery.toLowerCase()) ||
    entry.answer.toLowerCase().includes(journalSearchQuery.toLowerCase())
  );

  const [permissions, setPermissions] = useState({
    geolocation: 'prompt',
    notifications: 'prompt'
  });

  const requestGeo = () => {
    navigator.geolocation.getCurrentPosition(
      () => {
        checkPermissions();
      },
      () => {
        checkPermissions();
      }
    );
  };

  const requestNotify = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermissions(prev => ({ ...prev, notifications: result }));
      if (result === 'granted') {
        try {
          if (typeof Notification === 'function') {
            new Notification("UnTether: Protocol Active", {
              body: "Neural deterrent alerts are now authorized.",
            });
          }
        } catch (e) {
          console.warn("Notification constructor failed:", e);
        }
      }
      await checkPermissions();
    }
  };

  const checkPermissions = async () => {
    try {
      const geoState = 'permissions' in navigator
        ? (await navigator.permissions.query({ name: 'geolocation' as PermissionName })).state
        : 'prompt';

      const notifyState = 'Notification' in window
        ? Notification.permission
        : 'denied';

      setPermissions({
        geolocation: geoState,
        notifications: notifyState
      });

      if ('permissions' in navigator) {
        try {
          const geo = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          geo.onchange = () => setPermissions(prev => ({ ...prev, geolocation: geo.state }));
        } catch (e) {
          console.error("Geo permission query failed:", e);
        }
      }
    } catch (error) {
      console.error("checkPermissions failed:", error);
    }
  };

  useEffect(() => {
    checkPermissions();

    // PWA Install Prompt handling
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  if (view === 'journal') {
    return (
      <div className="space-y-8 pb-32 px-2">
        <div className="flex items-center justify-between pt-8 px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('main')}
              className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Back to settings"
            >
              <ArrowLeft size={22} />
            </button>
            <h2 className="text-3xl font-black text-white italic tracking-tight">Identity Log</h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-[var(--accent-purple)] uppercase tracking-widest">{(initialJournal || []).length} Entries</span>
          </div>
        </div>

        <div className="px-2">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-[var(--accent-purple)] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Filter by keyword..."
              value={journalSearchQuery}
              onChange={(e) => setJournalSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-[32px] py-5 pl-16 pr-8 text-sm font-bold text-white focus:outline-none focus:border-[var(--accent-purple)] transition-all placeholder:text-zinc-800"
            />
          </div>
        </div>

        <div className="px-2 pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newEntryText.trim() || !onAddJournalEntry) return;

              const newEntry: ReflectionEntry = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                question: "Manual Reflection Log",
                answer: newEntryText.trim(),
                reason: newEntryReason
              };

              onAddJournalEntry(newEntry);
              setNewEntryText('');
            }}
            className="opal-card p-6 rounded-[32px] border-[var(--accent-purple)]/30 shadow-[0_0_30px_rgba(216,180,254,0.05)] space-y-4 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-6 text-[var(--accent-purple)]/10 pointer-events-none">
              <PenTool size={64} strokeWidth={1.5} />
            </div>

            <div className="relative z-10 flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Log Intention</label>
              <textarea
                value={newEntryText}
                onChange={(e) => setNewEntryText(e.target.value)}
                placeholder="Why do I feel the urge to use my phone right now?"
                className="w-full bg-black/40 border border-white/10 rounded-[20px] p-5 text-sm font-bold text-white focus:outline-none focus:border-[var(--accent-purple)] transition-all min-h-[100px] resize-none placeholder:text-zinc-700"
              />
              <div className="flex gap-3">
                <select
                  value={newEntryReason}
                  onChange={(e) => setNewEntryReason(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-[20px] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[#d8b4fe] focus:outline-none focus:border-[var(--accent-purple)] appearance-none cursor-pointer"
                >
                  <option value="Boredom">Boredom</option>
                  <option value="Anxiety">Anxiety</option>
                  <option value="Work">Work</option>
                  <option value="Connection">Connection</option>
                  <option value="Habit">Habit</option>
                </select>
                <button
                  type="submit"
                  disabled={!newEntryText.trim()}
                  className="flex-1 bg-white text-black py-3 rounded-[20px] font-black uppercase text-[10px] tracking-widest hover:bg-[var(--accent-purple)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Entry
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          {filteredJournal && filteredJournal.length > 0 ? (
            filteredJournal.map((entry) => (
              <div key={entry.id} className="opal-card p-8 rounded-[48px] space-y-8 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none transition-colors group-hover:text-[var(--accent-purple)]/10">
                  <MessageSquareQuote size={120} strokeWidth={1} />
                </div>

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                      <Calendar size={12} className="text-[var(--accent-purple)]" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {entry.reason && (
                      <div className="flex items-center gap-3 bg-[#d8b4fe]/10 px-4 py-1.5 rounded-full border border-[#d8b4fe]/20">
                        <Target size={12} className="text-[#d8b4fe]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d8b4fe]">
                          {entry.reason}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopy(entry.id, entry.answer)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-zinc-500 hover:text-white transition-all active:scale-90"
                    title="Copy realization"
                  >
                    {copiedId === entry.id ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.3em] ml-1">The Inquiry</span>
                    <p className="text-white text-lg font-black italic leading-tight">
                      {entry.question}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase text-[var(--accent-purple)] tracking-[0.3em] ml-1">The Realization</span>
                    <div className="p-6 bg-black/40 rounded-[32px] border border-white/5 text-zinc-300 font-bold leading-relaxed shadow-inner">
                      "{entry.answer}"
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 flex flex-col items-center gap-8 text-center px-12 opacity-50">
              <BookText size={64} strokeWidth={1} className="text-zinc-800" />
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white italic">Silence Unrecorded</h3>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">
                  {journalSearchQuery ? "No entries match your search." : "Your archive of presence is empty. Complete focus sessions to record your journey."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'warning') {
    return (
      <div className="space-y-8 pb-24 px-2">
        <div className="flex items-center gap-4 pt-8">
          <button onClick={() => setView('main')} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-3xl font-black text-white italic">AI Persona</h2>
        </div>

        <div className="space-y-4">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest px-4">Choose your deterrent voice</p>
          <div className="grid gap-4">
            {personas.map(s => (
              <button
                key={s.id}
                onClick={() => handlePersonaSelect(s)}
                disabled={isSpeaking !== null}
                className={`opal-card p-8 rounded-[40px] text-left transition-all ${warningStyle === s.name ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]/10' : ''} ${isSpeaking && isSpeaking !== s.id ? 'opacity-30' : ''}`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center transition-all ${warningStyle === s.name ? 'bg-[var(--accent-primary)] text-black shadow-[0_0_20px_var(--accent-glow)]' : 'bg-white/5 text-zinc-600'}`}>
                    {isSpeaking === s.id ? <Volume2 className="animate-pulse" size={18} /> : s.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg">{s.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{s.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {warningStyle === s.name && <Check size={16} className="text-[var(--accent-primary)]" />}
                    <PlayCircle size={20} className={`transition-colors ${isSpeaking === s.id ? 'text-[var(--accent-primary)] animate-spin' : 'text-zinc-800'}`} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'banner') {
    const neonColors = [
      { name: 'Cyan', value: '#00f2ff' },
      { name: 'Rose', value: '#f43f5e' },
      { name: 'Emerald', value: '#10b981' },
      { name: 'Purple', value: '#bc13fe' },
      { name: 'Amber', value: '#fbbf24' }
    ];

    return (
      <div className="space-y-8 pb-24 px-2">
        <div className="flex items-center gap-4 pt-8">
          <button onClick={() => setView('main')} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-3xl font-black text-white italic">Banner UX</h2>
        </div>

        <div className="space-y-3">
          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest ml-4">Live Interface Preview</span>
          <div className="opal-card p-8 rounded-[44px] h-52 flex items-center justify-center relative overflow-hidden bg-black shadow-inner border-white/5">
            <div
              className="absolute inset-0 transition-opacity duration-1000"
              style={{
                background: `radial-gradient(circle at center, ${warningConfig.color}20 0%, transparent 70%)`,
                opacity: warningConfig.intensity / 100
              }}
            />
            <div className="text-center relative z-10 space-y-4">
              <div
                className="w-14 h-14 rounded-full mx-auto flex items-center justify-center animate-bounce shadow-lg"
                style={{
                  backgroundColor: `${warningConfig.color}10`,
                  color: warningConfig.color,
                  border: `1px solid ${warningConfig.color}40`,
                  boxShadow: `0 0 ${warningConfig.intensity / 2}px ${warningConfig.color}60`
                }}
              >
                <Shield size={28} />
              </div>
              <h4
                className="font-black italic uppercase tracking-tighter"
                style={{ color: warningConfig.color, fontSize: `${warningConfig.textScale * 1.5}rem`, textShadow: `0 0 15px ${warningConfig.color}80` }}
              >
                WARNING
              </h4>
            </div>
          </div>
        </div>

        <div className="opal-card rounded-[44px] border-white/5 p-8 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-zinc-500">
              <div className="flex items-center gap-2"><Palette size={14} /> Neon Signature</div>
              <span className="text-[var(--accent-primary)]">{neonColors.find(c => c.value === warningConfig.color)?.name || 'Custom'}</span>
            </div>
            <div className="flex gap-4">
              {neonColors.map(c => (
                <button
                  key={c.value}
                  onClick={() => setWarningConfig({ ...warningConfig, color: c.value })}
                  className={`w-11 h-11 rounded-full transition-all active:scale-90 relative ${warningConfig.color === c.value ? 'scale-110' : ''}`}
                  style={{ backgroundColor: c.value, boxShadow: `0 0 20px ${c.value}60` }}
                >
                  {warningConfig.color === c.value && <div className="absolute inset-0 border-2 border-white rounded-full animate-pulse"></div>}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-zinc-500">
              <div className="flex items-center gap-2"><Monitor size={14} /> Glow Intensity</div>
              <span className="font-bold text-white">{warningConfig.intensity}%</span>
            </div>
            <input
              type="range" min="10" max="100"
              value={warningConfig.intensity}
              onChange={(e) => setWarningConfig({ ...warningConfig, intensity: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-zinc-500">
              <div className="flex items-center gap-2"><Maximize size={14} /> Text Magnitude</div>
              <span className="font-bold text-white">{warningConfig.textScale}x</span>
            </div>
            <input
              type="range" min="1" max="2" step="0.1"
              value={warningConfig.textScale}
              onChange={(e) => setWarningConfig({ ...warningConfig, textScale: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-zinc-500">
              <div className="flex items-center gap-2"><LayoutDashboard size={14} /> Presentation Mode</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['minimal', 'immersive', 'aggressive'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setWarningConfig({ ...warningConfig, layout: mode as any })}
                  className={`py-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${warningConfig.layout === mode ? 'bg-[var(--accent-primary)] text-black border-transparent shadow-[0_0_20px_var(--accent-glow)]' : 'bg-white/5 border-white/5 text-zinc-600 hover:text-white'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'blocker') {
    return (
      <div className="space-y-6 pb-24 px-2">
        <div className="flex items-center gap-4 pt-8">
          <button onClick={() => setView('main')} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-3xl font-black text-white italic">Blocker</h2>
        </div>

        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-[var(--accent-primary)] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search restricted apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-[32px] py-6 pl-16 pr-8 text-sm font-bold text-white focus:outline-none focus:border-[var(--accent-primary)] transition-all placeholder:text-zinc-800"
          />
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Add website (e.g. facebook.com)"
            value={newWebsite}
            onChange={(e) => setNewWebsite(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddWebsite()}
            className="flex-1 bg-white/5 border border-white/5 rounded-[24px] py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-[var(--accent-primary)] transition-all placeholder:text-zinc-800"
          />
          <button
            onClick={handleAddWebsite}
            className="px-6 bg-white text-black rounded-[24px] font-black uppercase text-[10px] tracking-widest hover:bg-[var(--accent-primary)] transition-all active:scale-95"
          >
            Add
          </button>
        </div>

        <div className="opal-card rounded-[44px] border-white/5 overflow-hidden">
          <div className="p-7 bg-white/5 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <Info size={14} className="text-[var(--accent-primary)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Registry Engine</span>
            </div>
            <span className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-widest">{(apps || []).filter(a => a.blocked).length} Restricted</span>
          </div>

          <div className="divide-y divide-white/5 max-h-[50vh] overflow-y-auto no-scrollbar">
            {filteredApps.map(app => (
              <div key={app.id} className="p-7 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-black border border-white/5 flex items-center justify-center relative overflow-hidden transition-all group-hover:border-[var(--accent-primary)]/30">
                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: app.iconColor, color: app.iconColor }}></div>
                  </div>
                  <div>
                    <div className="font-bold text-white tracking-tight">{app.name}</div>
                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{app.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleApp(app.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all active:scale-95 ${app.blocked
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                      : 'bg-white/5 border-white/5 text-zinc-700'
                      }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">{app.blocked ? 'Locked' : 'Unlock'}</span>
                    {app.blocked ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  {app.category === 'Website' && (
                    <button
                      onClick={() => setApps(prev => prev.filter(a => a.id !== app.id))}
                      className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-zinc-800 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24 px-2">
      <div className="flex items-center gap-4 pt-8 px-4">
        <button
          onClick={onBack}
          className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-3xl font-black text-white italic tracking-tight">System Settings</h2>
      </div>

      <div className="text-center space-y-2 py-6">
        <h2 className="text-[80px] font-black tracking-tighter text-white uppercase italic leading-none">System</h2>
        <p className="text-zinc-600 text-[11px] font-black uppercase tracking-[0.8em]">Core Kernel v1.2.0</p>
      </div>

      <div className="space-y-6">
        <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-700 ml-6">Preferences</h3>
        <div className="opal-card rounded-[48px] border-white/5 overflow-hidden shadow-2xl">
          <SettingItem icon={<Smartphone size={22} />} label="App Blocker List" sub={`${(apps || []).filter(a => a.blocked).length} suppressions active`} onClick={() => setView('blocker')} />
          <SettingItem icon={<BookText size={22} />} label="Reflection Journal" sub={`${initialJournal?.length || 0} realizations recorded`} onClick={() => setView('journal')} />
          <SettingItem icon={<Bell size={22} />} label="AI Persona" sub={`Voice: ${warningStyle}`} onClick={() => setView('warning')} />
          <SettingItem icon={<Sliders size={22} />} label="Warning Customizer" sub={`Style: ${warningConfig.layout}`} onClick={() => setView('banner')} />
          {deferredPrompt && (
            <SettingItem icon={<Download size={22} className="text-emerald-400" />} label="Install Mobile App" sub="Add UnTether to your Home Screen" onClick={installPWA} />
          )}
        </div>
      </div>

      <div className="space-y-6 pb-12">
        <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-700 ml-4">Permission Center</h3>
        <div className="opal-card rounded-[44px] border-white/5 overflow-hidden shadow-2xl divide-y divide-white/5">
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-[24px] bg-zinc-950 border border-white/5 flex items-center justify-center text-zinc-600">
                <MapPin size={22} />
              </div>
              <div className="text-left">
                <div className="font-black text-lg tracking-tight text-white">Geolocation</div>
                <div className="text-[10px] text-zinc-700 font-black uppercase tracking-widest mt-0.5">Required for GeoFence Jurisdictions</div>
              </div>
            </div>
            <button
              onClick={requestGeo}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${permissions.geolocation === 'granted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white text-black hover:bg-[var(--accent-primary)]'}`}
            >
              {permissions.geolocation === 'granted' ? 'Authorized' : 'Authorize'}
            </button>
          </div>
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-[24px] bg-zinc-950 border border-white/5 flex items-center justify-center text-zinc-600">
                <Bell size={22} />
              </div>
              <div className="text-left">
                <div className="font-black text-lg tracking-tight text-white">Notifications</div>
                <div className="text-[10px] text-zinc-700 font-black uppercase tracking-widest mt-0.5">Required for AI Deterrent Alerts</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {permissions.notifications === 'granted' && (
                <button
                  onClick={() => {
                    new Notification("UnTether Neural Link Active", {
                      body: "Notification connection successfully established."
                    });
                  }}
                  className="px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                >
                  Test
                </button>
              )}
              <button
                onClick={requestNotify}
                className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${permissions.notifications === 'granted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white text-black hover:bg-[var(--accent-primary)]'}`}
              >
                {permissions.notifications === 'granted' ? 'Authorized' : 'Authorize'}
              </button>
            </div>
          </div>
          <div className="p-8 bg-rose-500/5 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-[24px] bg-rose-950/20 border border-rose-500/10 flex items-center justify-center text-rose-500">
                <Lock size={22} />
              </div>
              <div className="text-left">
                <div className="font-black text-lg tracking-tight text-white">Revoke Consent</div>
                <div className="text-[10px] text-rose-700 font-black uppercase tracking-widest mt-0.5">Stop all background tracking</div>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm("This will stop all background tracking and geofencing. Are you sure?")) {
                  localStorage.removeItem('untether_consent');
                  window.location.reload();
                }
              }}
              className="px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white hover:bg-rose-600 transition-all"
            >
              Revoke
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-700 ml-4">Account</h3>
        <button
          onClick={onLogout}
          className="w-full p-8 opal-card rounded-[44px] border-rose-900/10 hover:border-rose-500/40 flex items-center justify-between group transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-5 text-rose-500">
            <div className="w-14 h-14 rounded-[24px] bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition-all shadow-inner">
              <LogOut size={24} />
            </div>
            <div className="text-left">
              <div className="font-black text-base uppercase tracking-widest">Sign Out</div>
              <div className="text-[10px] font-bold text-rose-500/50 uppercase tracking-tighter">Terminate Session</div>
            </div>
          </div>
          <ChevronRight size={22} className="text-rose-900/30 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      <div className="text-center space-y-2 opacity-20 py-10">
        <p className="text-[10px] font-black uppercase tracking-[1em]">UnTether Labs</p>
      </div>
    </div>
  );
};

const SettingItem: React.FC<{ icon: React.ReactNode; label: string; sub: string; onClick?: () => void; }> = ({ icon, label, sub, onClick }) => (
  <button onClick={onClick} className="w-full p-8 flex items-center justify-between hover:bg-white/[0.03] transition-colors border-b border-white/5 last:border-0 group">
    <div className="flex items-center gap-6">
      <div className="w-14 h-14 rounded-[24px] bg-zinc-950 border border-white/5 flex items-center justify-center text-zinc-600 group-hover:text-[#d8b4fe] group-hover:border-[#d8b4fe]/40 transition-all shadow-inner">
        {icon}
      </div>
      <div className="text-left">
        <div className="font-black text-lg tracking-tight text-white group-hover:translate-x-1 transition-transform duration-500">{label}</div>
        <div className="text-[10px] text-zinc-700 font-black uppercase tracking-widest mt-1">{sub}</div>
      </div>
    </div>
    <ChevronRight size={20} className="text-zinc-800 group-hover:text-zinc-500 group-hover:translate-x-1 transition-all" />
  </button>
);
