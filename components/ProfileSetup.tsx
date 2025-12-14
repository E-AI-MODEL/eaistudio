import React, { useState, useEffect } from 'react';
import { LearnerProfile } from '../types';

interface ProfileSetupProps {
  onComplete: (profile: LearnerProfile, goal: string) => void;
  isOpen: boolean;
  language: 'nl' | 'en';
  onLanguageChange: (lang: 'nl' | 'en') => void;
  currentProfile?: LearnerProfile; // Added to receive existing data
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, isOpen, language, onLanguageChange, currentProfile }) => {
  const [formData, setFormData] = useState<LearnerProfile>({
    name: '',
    subject: '',
    level: '',
    grade: ''
  });
  const [goal, setGoal] = useState('');

  // Translations
  const texts = {
      nl: {
          form: {
              title: "Sessie Configuratie",
              subtitle: "Vul de context in voor een optimale begeleiding.",
              name: "Naam",
              namePlaceholder: "Je naam",
              subject: "Vak / Onderwerp",
              subjectPlaceholder: "Bijv. Geschiedenis",
              level: "Niveau",
              select: "Selecteer...",
              grade: "Leerjaar / Groep",
              gradePlaceholder: "Bijv. 4",
              goal: "Wat is je concrete doel?",
              goalPlaceholder: "Bijv. Ik wil een samenvatting maken van H4 of ik snap de stelling van Pythagoras niet.",
              start: "START SESSIE",
              skip: "Sla configuratie over (Quick Start)"
          },
          levels: [
              { val: "VMBO", label: "VMBO" },
              { val: "HAVO", label: "HAVO" },
              { val: "VWO", label: "VWO" }
          ]
      },
      en: {
          form: {
              title: "Session Configuration",
              subtitle: "Provide context for optimal guidance.",
              name: "Name",
              namePlaceholder: "Your name",
              subject: "Subject / Topic",
              subjectPlaceholder: "E.g. History",
              level: "Track / Level",
              select: "Select Track...",
              grade: "Grade / Year",
              gradePlaceholder: "E.g. 10",
              goal: "What is your concrete goal?",
              goalPlaceholder: "E.g. I want to summarize Ch. 4 or I don't understand the Pythagorean theorem.",
              start: "START SESSION",
              skip: "Skip configuration (Quick Start)"
          },
          levels: [
              { val: "Vocational / Technical", label: "Vocational / Technical" },
              { val: "Standard High School", label: "Standard High School" },
              { val: "Honors / AP / IB", label: "Honors / AP / IB" }
          ]
      }
  };

  const t = texts[language];

  // Map levels between languages so the dropdown selects the equivalent
  const mapLevel = (lvl: string | null, targetLang: 'nl' | 'en'): string => {
      if (!lvl) return '';
      const map: Record<string, string> = {
        'VMBO': 'Vocational / Technical',
        'HAVO': 'Standard High School',
        'VWO': 'Honors / AP / IB',
        'Vocational / Technical': 'VMBO',
        'Standard High School': 'HAVO',
        'Honors / AP / IB': 'VWO'
      };
      // If the level is already valid in target language, return it, else try mapping, else keep original
      const validOptions = texts[targetLang].levels.map(l => l.val);
      if (validOptions.includes(lvl)) return lvl;
      
      const mapped = map[lvl];
      return validOptions.includes(mapped) ? mapped : lvl;
  };

  // Pre-fill form when opening with an existing profile
  useEffect(() => {
    if (isOpen && currentProfile) {
        setFormData(prev => ({
            ...prev,
            name: currentProfile.name || '',
            subject: currentProfile.subject || '',
            level: mapLevel(currentProfile.level, language),
            grade: currentProfile.grade || ''
        }));
    }
  }, [isOpen, currentProfile, language]);

  // Handler to toggle language inside the setup component
  const toggleLanguage = () => {
      const newLang = language === 'nl' ? 'en' : 'nl';
      onLanguageChange(newLang); // This will update parent state
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;
    onComplete(formData, goal);
  };

  const handleSkip = () => {
    const emptyProfile: LearnerProfile = {
        name: language === 'en' ? 'Guest' : 'Gast',
        subject: null,
        level: null,
        grade: null
    };
    const skipMsg = language === 'en' 
        ? "I would like to start an open session without specific context." 
        : "Ik wil graag een open sessie starten zonder specifieke context.";
    onComplete(emptyProfile, skipMsg);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b1120] text-slate-200 font-sans">
      
      {/* LANGUAGE TOGGLE (Fixed Top Right) */}
      <div className="absolute top-6 right-6 z-[70] animate-in fade-in duration-1000">
          <button 
            onClick={toggleLanguage}
            className="text-xs font-bold font-mono px-3 py-1.5 bg-white/10 rounded border border-white/20 hover:bg-white/20 transition-all text-white"
          >
              {language === 'nl' ? 'NL' : 'EN'}
          </button>
      </div>

      {/* INTAKE FORM */}
      <div className="w-full max-w-md p-6 animate-in zoom-in-95 duration-500">
          <div className="bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
              {/* Decorative top bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600"></div>

              <div className="mb-6 text-center">
                  <h2 className="text-lg font-bold text-white mb-1">{t.form.title}</h2>
                  <p className="text-xs text-slate-400">{t.form.subtitle}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500">{t.form.name}</label>
                          <input 
                              type="text" 
                              required
                              value={formData.name || ''}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                              className="w-full bg-black/20 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                              placeholder={t.form.namePlaceholder}
                          />
                      </div>
                       <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500">{t.form.subject}</label>
                          <input 
                              type="text" 
                              required
                              value={formData.subject || ''}
                              onChange={e => setFormData({...formData, subject: e.target.value})}
                              className="w-full bg-black/20 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                              placeholder={t.form.subjectPlaceholder}
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500">{t.form.level}</label>
                          <select 
                              value={formData.level || ''}
                              onChange={e => setFormData({...formData, level: e.target.value})}
                              className="w-full bg-black/20 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                          >
                              <option value="">{t.form.select}</option>
                              {t.levels.map(opt => (
                                  <option key={opt.val} value={opt.val}>{opt.label}</option>
                              ))}
                          </select>
                      </div>
                       <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500">{t.form.grade}</label>
                          <input 
                              type="text" 
                              value={formData.grade || ''}
                              onChange={e => setFormData({...formData, grade: e.target.value})}
                              className="w-full bg-black/20 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                              placeholder={t.form.gradePlaceholder}
                          />
                      </div>
                  </div>

                  <div className="space-y-1 pt-2">
                      <label className="text-[10px] uppercase font-bold text-cyan-400">{t.form.goal}</label>
                      <textarea 
                          required
                          value={goal}
                          onChange={e => setGoal(e.target.value)}
                          className="w-full bg-black/20 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all h-20 resize-none"
                          placeholder={t.form.goalPlaceholder}
                      />
                  </div>

                  <button 
                      type="submit"
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                  >
                      <span>{t.form.start}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                  </button>

                  <button 
                      type="button"
                      onClick={handleSkip}
                      className="w-full mt-2 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors hover:underline"
                  >
                      {t.form.skip}
                  </button>
              </form>
          </div>
      </div>
    </div>
  );
};

export default ProfileSetup;