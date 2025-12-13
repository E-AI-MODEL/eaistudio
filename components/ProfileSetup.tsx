import React, { useState, useEffect } from 'react';
import { LearnerProfile } from '../types';

interface ProfileSetupProps {
  onComplete: (profile: LearnerProfile, goal: string) => void;
  isOpen: boolean;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, isOpen }) => {
  const [step, setStep] = useState<'ANIMATION' | 'FORM'>('ANIMATION');
  const [formData, setFormData] = useState<LearnerProfile>({
    name: '',
    subject: '',
    level: '',
    grade: ''
  });
  const [goal, setGoal] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('ANIMATION');
      const timer = setTimeout(() => {
        setStep('FORM');
      }, 2500); // 2.5s animation
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;
    onComplete(formData, goal);
  };

  const handleSkip = () => {
    const emptyProfile: LearnerProfile = {
        name: 'Gast',
        subject: null,
        level: null,
        grade: null
    };
    onComplete(emptyProfile, "Ik wil graag een open sessie starten zonder specifieke context.");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b1120] text-slate-200 font-sans">
      
      {/* PHASE 1: BOOT SEQUENCE ANIMATION */}
      {step === 'ANIMATION' && (
        <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-700">
           <div className="relative w-24 h-24">
              {/* Spinning Rings */}
              <div className="absolute inset-0 border-4 border-t-cyan-500 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-2 border-t-transparent border-r-purple-500 border-b-transparent border-l-cyan-400 rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              </div>
           </div>
           
           <div className="text-center space-y-2">
               <h2 className="text-xl font-bold tracking-widest uppercase text-white">EAI Neural Core</h2>
               <div className="flex flex-col text-[10px] font-mono text-cyan-400 space-y-1">
                   <span className="animate-[pulse_0.5s_ease-in-out_infinite]">INITIALIZING PROTOCOLS...</span>
                   <span className="opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.5s_forwards]">LOADING SSOT ARCHITECTURE...</span>
                   <span className="opacity-0 animate-[fadeIn_0.5s_ease-in-out_1.0s_forwards]">CALIBRATING DIDACTIC WEIGHTS...</span>
                   <span className="opacity-0 animate-[fadeIn_0.5s_ease-in-out_1.5s_forwards]">ESTABLISHING SECURE LINK...</span>
               </div>
           </div>
        </div>
      )}

      {/* PHASE 2: INTAKE FORM */}
      {step === 'FORM' && (
        <div className="w-full max-w-md p-6 animate-in zoom-in-95 duration-500">
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
                {/* Decorative top bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600"></div>

                <div className="mb-6 text-center">
                    <h2 className="text-lg font-bold text-white mb-1">Sessie Configuratie</h2>
                    <p className="text-xs text-slate-400">Vul de context in voor een optimale begeleiding.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500">Naam</label>
                            <input 
                                type="text" 
                                required
                                value={formData.name || ''}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-black/20 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                                placeholder="Je naam"
                            />
                        </div>
                         <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500">Vak / Onderwerp</label>
                            <input 
                                type="text" 
                                required
                                value={formData.subject || ''}
                                onChange={e => setFormData({...formData, subject: e.target.value})}
                                className="w-full bg-black/20 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                                placeholder="Bijv. Geschiedenis"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500">Niveau</label>
                            <select 
                                value={formData.level || ''}
                                onChange={e => setFormData({...formData, level: e.target.value})}
                                className="w-full bg-black/20 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                            >
                                <option value="">Selecteer...</option>
                                <option value="VMBO">VMBO</option>
                                <option value="HAVO">HAVO</option>
                                <option value="VWO">VWO</option>
                            </select>
                        </div>
                         <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500">Leerjaar / Groep</label>
                            <input 
                                type="text" 
                                value={formData.grade || ''}
                                onChange={e => setFormData({...formData, grade: e.target.value})}
                                className="w-full bg-black/20 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                                placeholder="Bijv. 4"
                            />
                        </div>
                    </div>

                    <div className="space-y-1 pt-2">
                        <label className="text-[10px] uppercase font-bold text-cyan-400">Wat is je concrete doel?</label>
                        <textarea 
                            required
                            value={goal}
                            onChange={e => setGoal(e.target.value)}
                            className="w-full bg-black/20 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all h-20 resize-none"
                            placeholder="Bijv. Ik wil een samenvatting maken van H4 of ik snap de stelling van Pythagoras niet."
                        />
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                    >
                        <span>START SESSIE</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>

                    <button 
                        type="button"
                        onClick={handleSkip}
                        className="w-full mt-2 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors hover:underline"
                    >
                        Sla configuratie over (Quick Start)
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSetup;