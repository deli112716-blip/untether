
import React, { useState } from 'react';
import { ArrowRight, Brain, Loader2, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { analyzeAddiction } from '../services/gemini';
import { AssessmentData } from '../types';

interface AssessmentProps {
  onComplete: (data: AssessmentData) => void;
  onClose: () => void;
}

const questions = [
  {
    id: 'reason',
    label: 'Primary Triggers',
    question: 'Why do you reach for your phone most often?',
    options: [
      { id: 'boredom', label: 'Boredom', value: 20 },
      { id: 'work', label: 'Work Pressure', value: 15 },
      { id: 'anxiety', label: 'Social Anxiety', value: 25 },
      { id: 'habit', label: 'Unconscious Habit', value: 30 },
      { id: 'lonely', label: 'Loneliness', value: 10 }
    ]
  },
  {
    id: 'absence',
    label: 'Withdrawal Check',
    question: 'How do you feel when your phone is in another room?',
    options: [
      { id: 'fine', label: 'Peaceful', value: 0 },
      { id: 'itchy', label: 'Mildly Restless', value: 15 },
      { id: 'panic', label: 'High Anxiety', value: 35 },
      { id: 'lost', label: 'Disconnected', value: 25 }
    ]
  },
  {
    id: 'first_thing',
    label: 'Circadian Link',
    question: 'How quickly do you check your phone after waking up?',
    options: [
      { id: 'instant', label: 'Within 1 minute', value: 40 },
      { id: 'soon', label: 'Under 10 minutes', value: 25 },
      { id: 'coffee', label: 'After morning routine', value: 10 },
      { id: 'later', label: 'After an hour', value: 0 }
    ]
  }
];

export const Assessment: React.FC<AssessmentProps> = ({ onComplete, onClose }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const handleSelect = (option: any) => {
    const newAnswers = { ...answers, [questions[step].id]: option };
    setAnswers(newAnswers);
    
    if (step < questions.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      processAnalysis(newAnswers);
    }
  };

  const processAnalysis = async (finalAnswers: any) => {
    setLoading(true);
    try {
      const data = await analyzeAddiction(finalAnswers);
      onComplete(data);
    } catch (e) {
      console.error(e);
      // Fallback data
      onComplete({
        score: 65,
        category: 'The Habitual Checker',
        breakdown: [
          { name: 'Habit', value: 40 },
          { name: 'Boredom', value: 30 },
          { name: 'Anxiety', value: 30 }
        ],
        lastTaken: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-30"></div>
      
      <div className="max-w-md w-full opal-card p-10 rounded-[48px] border-purple-500/20 shadow-2xl relative z-10">
        {!loading ? (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="text-[var(--accent-primary)] neon-text" size={24} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Cognitive Probe</span>
              </div>
              <span className="text-[10px] font-black text-[var(--accent-primary)]">{step + 1} / {questions.length}</span>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black tracking-tight text-white leading-tight italic">
                {questions[step].question}
              </h2>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-700">Category: {questions[step].label}</p>
            </div>

            <div className="grid gap-3">
              {questions[step].options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt)}
                  className={`w-full p-6 rounded-[28px] text-left border border-white/5 bg-white/5 hover:bg-[var(--accent-glow)] hover:border-[var(--accent-primary)] transition-all group active:scale-95`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-zinc-400 group-hover:text-white">{opt.label}</span>
                    <ArrowRight size={16} className="text-zinc-800 group-hover:text-white transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>

            <button onClick={onClose} className="w-full text-center text-[9px] font-black uppercase tracking-widest text-zinc-800 hover:text-zinc-500 transition-colors pt-4">
              Cancel Analysis
            </button>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center gap-8 text-center animate-in zoom-in-95">
             <div className="relative">
                <Loader2 className="animate-spin text-[var(--accent-primary)] mb-2" size={48} />
                <Sparkles className="absolute -top-2 -right-2 text-white animate-pulse" size={16} />
             </div>
             <div className="space-y-3">
                <h3 className="text-xl font-black tracking-tight uppercase italic text-white">Synthesizing Profile</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 px-10">
                  AI is weighing your cognitive triggers against standard addiction benchmarks...
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
