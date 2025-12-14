import React from 'react';
import { EAIAnalysis, MechanicalState, LearnerProfile } from '../types';
import { getEAICore, SSOTBand } from '../utils/ssotParser';
import type { EAIStateLike } from '../utils/eaiLearnAdapter';

interface DashboardProps {
  analysis: EAIAnalysis | null;
  mechanical: MechanicalState | null;
  isOpen: boolean;
  onClose: () => void;
  theme: any; // Using dynamic theme object from parent
  isLoading?: boolean;
  profile?: LearnerProfile | null; // Passed expressly for display
  eaiState?: EAIStateLike | null;
  language?: 'nl' | 'en';
}

// Translations for Cognitive Modes (Internal NL keys -> Display EN/NL)
const MODE_TRANSLATIONS: Record<string, { nl: string, en: string }> = {
    'ANALYTISCH': { nl: "Analytisch", en: "Analytical" },
    'REFLECTIEF': { nl: "Reflectief", en: "Reflective" },
    'SYSTEMISCH': { nl: "Systemisch", en: "Systemic" },
    'PRAGMATISCH': { nl: "Pragmatisch", en: "Pragmatic" },
    'CREATIEF': { nl: "Creatief", en: "Creative" },
    'NORMATIEF': { nl: "Normatief", en: "Normative" },
    'ONBEKEND': { nl: "Onbekend", en: "Unknown" }
};

// Define a "Soft Limit" for the session visualization. 
// A typical browser session aims for < 32k for optimal latency/cost.
const SESSION_SOFT_LIMIT = 32000;

const Dashboard: React.FC<DashboardProps> = ({ analysis, mechanical, isOpen, onClose, theme, isLoading = false, profile, eaiState, language = 'nl' }) => {
  
  const currentCore = getEAICore(language as 'nl' | 'en');

  // Helper to get full rich data from SSOT
  const getActiveBandDetails = (): { rubricName: string, band: SSOTBand }[] => {
    if (!analysis) return [];
    
    // Collect all active codes including the new secondary dimensions
    const activeCodes = [
        ...analysis.coregulation_bands,
        ...analysis.process_phases,
        ...analysis.task_densities,
        ...(analysis.secondary_dimensions || []) 
    ];

    const details: { rubricName: string, band: SSOTBand }[] = [];

    activeCodes.forEach(code => {
        currentCore.rubrics.forEach(rubric => {
            const foundBand = rubric.bands.find(b => b.band_id === code);
            if (foundBand) {
                details.push({ rubricName: rubric.name, band: foundBand });
            }
        });
    });
    return details;
  };

  const activeBands = getActiveBandDetails();
  const activeFixDetails = analysis?.active_fix 
    ? currentCore.commands.find(c => c.command === analysis.active_fix) 
    : null;

  // Labels based on language
  const labels = {
      header: language === 'en' ? 'SSOT MONITOR' : 'SSOT MONITOR',
      uplink: language === 'en' ? 'SSOT UPLINK ACTIVE' : 'SSOT UPLINK ACTIVE',
      profile: language === 'en' ? 'Current Profile' : 'Huidig Profiel',
      subject: language === 'en' ? 'Subject:' : 'Vak:',
      level: language === 'en' ? 'Level:' : 'Niveau:',
      grade: language === 'en' ? 'Grade:' : 'Leerjaar:',
      name: language === 'en' ? 'Name:' : 'Naam:',
      intervention: language === 'en' ? 'Active Intervention' : 'Actieve Interventie',
      didactic_steer: language === 'en' ? 'Didactic Steering' : 'Didactische bijsturing',
      no_intervention: language === 'en' ? 'No active intervention' : 'Geen actieve interventie',
      task_density: language === 'en' ? 'Task Density' : 'Taakdichtheid',
      passive: language === 'en' ? 'Passive (AI)' : 'Passief (AI)',
      active: language === 'en' ? 'Active (Learner)' : 'Actief (Leerling)',
      observation_details: language === 'en' ? 'Observation Details' : 'Observatie Details',
      learner_behavior: language === 'en' ? 'Learner Behavior:' : 'Leerling gedrag:',
      principle: language === 'en' ? 'Principle:' : 'Principe:',
      intervention_label: language === 'en' ? 'Intervention:' : 'Interventie:',
      // RENAMED HERE:
      internal_logic: language === 'en' ? 'SSOT Mapping Rationale' : 'SSOT Selectie Rationale',
      waiting: language === 'en' ? '> Waiting for stream...' : '> Waiting for stream...',
      neural_state: language === 'en' ? 'Neural State' : 'Neurale Status',
      epistemic_integrity: language === 'en' ? 'Epistemic Integrity' : 'Epistemische Integriteit',
      cycle_fingerprint: language === 'en' ? 'Cycle Fingerprint' : 'Cyclus Vingerafdruk',
      context_load: language === 'en' ? 'Context Load (Session)' : 'Context Belasting (Sessie)',
  };

  // Layout container classes with dynamic theme
  const containerClasses = `
    fixed inset-y-0 right-0 w-full sm:w-80 ${theme.sidebar} border-l ${theme.border} 
    z-50 transform transition-transform duration-300 ease-in-out flex flex-col
    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    lg:relative lg:translate-x-0 lg:w-80 lg:flex lg:z-0
  `;

  // === VISUALIZATION HELPERS ===

  // 1. Epistemic Status (Color & Value)
  const getEpistemicVisuals = () => {
      const status = analysis?.epistemic_status || 'ONBEKEND';
      switch(status) {
          case 'FEIT': return { color: 'bg-cyan-500', width: '95%', label: language === 'en' ? 'FACT' : 'FEIT' };
          case 'INTERPRETATIE': return { color: 'bg-purple-500', width: '65%', label: language === 'en' ? 'INTERPRETATION' : 'INTERPRETATIE' };
          case 'SPECULATIE': return { color: 'bg-orange-500', width: '35%', label: language === 'en' ? 'SPECULATION' : 'SPECULATIE' };
          default: return { color: 'bg-slate-600', width: '10%', label: '-' };
      }
  };
  const epiVis = getEpistemicVisuals();

  // 2. Cognitive Mode Display
  const getModeLabel = () => {
      const rawMode = analysis?.cognitive_mode || 'ONBEKEND';
      const mapping = MODE_TRANSLATIONS[rawMode];
      return mapping ? mapping[language] : rawMode;
  };

  // 3. Cycle Fingerprint (Active Dimensions)
  const dimensions = ['P', 'TD', 'C', 'V', 'T', 'E', 'L'];
  const getActiveDimensions = () => {
      const active = new Set<string>();
      if (!analysis) return active;
      
      const allCodes = [
          ...analysis.process_phases, 
          ...analysis.coregulation_bands, 
          ...analysis.task_densities,
          ...(analysis.secondary_dimensions || [])
      ];
      
      // Simple heuristic: if code starts with 'P', P is active.
      allCodes.forEach(code => {
          dimensions.forEach(dim => {
              if (code.startsWith(dim)) active.add(dim);
          });
      });
      return active;
  };
  const activeDims = getActiveDimensions();

  // 4. Context Load (Real calculation against Soft Limit)
  const contextLoadPct = Math.min(100, Math.round(((mechanical?.inputTokens || 0) / SESSION_SOFT_LIMIT) * 100)); 

  return (
    <div className={containerClasses}>
      
      {/* Header */}
      <div className={`h-14 flex items-center justify-between px-4 ${theme.bg} border-b ${theme.border} bg-opacity-50`}>
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-orange-400 animate-ping' : (analysis ? 'bg-green-500' : 'bg-red-500')}`}></div>
            <span className={`font-mono text-xs font-bold tracking-widest uppercase ${isLoading ? 'text-orange-400 animate-pulse' : 'text-slate-400'}`}>
                {isLoading ? labels.uplink : labels.header}
            </span>
        </div>
        
        {/* Mobile Close */}
        <button 
            onClick={onClose} 
            className="lg:hidden p-1 text-slate-400 hover:text-white"
        >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </div>

      {/* Main Content Area - Added pb-20 for mobile nav spacing */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide relative pb-20 lg:pb-4">
        
        {/* LOADING STATE OVERLAY */}
        {isLoading ? (
            <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-[2px] p-6 flex flex-col justify-center">
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 blur-sm animate-[scan_2s_ease-in-out_infinite]" style={{ top: '20%' }}></div>
                <div className="font-mono text-[10px] space-y-3">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <span className="animate-pulse">▶</span>
                        <span>ESTABLISHING SECURE LINK...</span>
                    </div>
                    <div className="pl-4 space-y-1 text-slate-400 opacity-80">
                         <p>{'>'} Encrypting context payload...</p>
                         <p>{'>'} Transmitting to Neural Core...</p>
                         <p>{'>'} Awaiting SSOT validation...</p>
                    </div>
                </div>
            </div>
        ) : null}

        {/* 0. LEARNER PROFILE (Mobiel zichtbaar) */}
        {profile && (
            <div className={`border ${theme.border} bg-white/5 rounded-lg p-3 lg:hidden`}>
                 <div className="flex justify-between items-center text-xs text-slate-400 mb-2 border-b border-white/10 pb-1">
                    <span className="uppercase font-bold text-[10px]">{labels.profile}</span>
                 </div>
                 <div className="space-y-1.5 text-xs">
                     <div className="flex justify-between"><span className="opacity-50">{labels.subject}</span> <span className="text-slate-200 font-medium">{profile.subject || '-'}</span></div>
                     <div className="flex justify-between"><span className="opacity-50">{labels.level}</span> <span className="text-slate-200 font-medium">{profile.level || '-'}</span></div>
                     <div className="flex justify-between"><span className="opacity-50">{labels.grade}</span> <span className="text-slate-200 font-medium">{profile.grade || '-'}</span></div>
                     {profile.name && <div className="flex justify-between"><span className="opacity-50">{labels.name}</span> <span className="text-slate-200 font-medium">{profile.name}</span></div>}
                 </div>
            </div>
        )}

        {/* 0.5 NEURAL STATE & INTEGRITY */}
        <div className={`bg-white/5 border ${theme.border} rounded-lg p-3 space-y-3`}>
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{labels.neural_state}</span>
                <span className={`text-[10px] font-mono font-bold ${theme.accentText} uppercase`}>{getModeLabel()}</span>
             </div>
             
             {/* Epistemic Integrity Meter */}
             <div>
                 <div className="flex justify-between text-[8px] text-slate-500 mb-1 uppercase">
                     <span>{labels.epistemic_integrity}</span>
                     <span>{epiVis.label}</span>
                 </div>
                 <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                     <div className={`h-full ${epiVis.color} shadow-[0_0_8px_currentColor] transition-all duration-500`} style={{ width: epiVis.width }}></div>
                 </div>
             </div>
        </div>

        {/* 0.6 CYCLE FINGERPRINT (Radar Visualization) */}
        <div className={`border ${theme.border} bg-black/20 rounded-lg p-3 relative`}>
             <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-3 text-center">{labels.cycle_fingerprint}</h3>
             <div className="flex justify-between items-center px-1">
                 {dimensions.map(dim => {
                     const isActive = activeDims.has(dim);
                     return (
                         <div key={dim} className="flex flex-col items-center gap-1">
                             <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isActive ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] scale-125' : 'bg-slate-800'}`}></div>
                             <span className={`text-[8px] font-mono font-bold ${isActive ? 'text-white' : 'text-slate-600'}`}>{dim}</span>
                         </div>
                     )
                 })}
             </div>
             {/* Simple aesthetic connector line */}
             <div className="absolute top-[2.6rem] left-5 right-5 h-[1px] bg-slate-800 -z-10"></div>
        </div>


        {/* 1. ACTIVE INTERVENTION CARD */}
        {analysis?.active_fix ? (
            <div className={`border ${theme.border} bg-black/20 rounded-lg p-3 relative overflow-hidden ${theme.glow}`}>
                <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.accentText}`}>{labels.intervention}</span>
                </div>
                <div className="flex justify-between items-start gap-2 mb-2">
                     <p className="text-sm text-white font-bold leading-tight">
                        {activeFixDetails ? activeFixDetails.description : labels.didactic_steer}
                     </p>
                </div>
                <code className={`block w-full text-center ${theme.bg} ${theme.accentText} px-1.5 py-1 rounded text-[10px] font-mono border ${theme.border}`}>
                    {analysis.active_fix}
                </code>
            </div>
        ) : (
            <div className={`border ${theme.border} border-dashed bg-transparent rounded-lg p-4 text-center`}>
                <span className="text-[10px] text-slate-500 uppercase">{labels.no_intervention}</span>
            </div>
        )}
            
        {/* 2. TASK DENSITY / AGENCY METER */}
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase">{labels.task_density}</h3>
                <span className={`text-[10px] font-mono font-bold ${theme.accentText}`}>{analysis?.task_density_balance ?? 50}%</span>
            </div>
            
            <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-900/40 via-blue-900/40 to-green-900/40"></div>
                <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(255,255,255,1)] transition-all duration-700 ease-out z-10"
                    style={{ left: `${analysis?.task_density_balance ?? 50}%` }}
                ></div>
            </div>
            <div className="flex justify-between text-[8px] text-slate-600 font-mono uppercase">
                <span>{labels.passive}</span>
                <span>{labels.active}</span>
            </div>
        </div>

        {/* 4. DEEP SSOT ANALYSIS (Expandable Rich Data) */}
        {activeBands.length > 0 && (
            <div className={`space-y-3 pt-3 border-t ${theme.border}`}>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase">{labels.observation_details}</h3>
                
                {activeBands.map((item, idx) => (
                    <details key={idx} className={`bg-black/20 rounded border ${theme.border} group open:bg-black/40 transition-colors`}>
                        <summary className="p-3 cursor-pointer list-none select-none">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[9px] font-mono ${theme.accentText} border ${theme.border} px-1 rounded`}>
                                    {item.rubricName}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-white bg-slate-800 px-1.5 rounded">
                                        {item.band.band_id}
                                    </span>
                                    {/* Chevron Icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-slate-500 group-open:rotate-180 transition-transform">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-xs text-white font-medium leading-tight">
                                {item.band.label}
                            </p>
                        </summary>
                        
                        {/* Expandable Content */}
                        <div className="px-3 pb-3 pt-0 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                             {/* Description */}
                             <p className="text-[10px] text-slate-400 italic border-l-2 border-slate-600 pl-2">
                                {item.band.description}
                             </p>

                             {/* Observations */}
                             <div className="grid grid-cols-1 gap-2">
                                {item.band.learner_obs && item.band.learner_obs.length > 0 && (
                                    <div>
                                        <span className="text-[8px] uppercase text-slate-500 font-bold block mb-0.5">{labels.learner_behavior}</span>
                                        <ul className="list-disc list-inside space-y-0.5">
                                            {item.band.learner_obs.map((obs, i) => (
                                                <li key={i} className="text-[10px] text-slate-300 leading-tight">
                                                    {obs}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                             </div>

                             {/* Didactic Fix / Principle */}
                             <div className={`pt-2 border-t ${theme.border} border-dashed`}>
                                 <div className="mb-1">
                                    <span className="text-[8px] uppercase text-slate-500 font-bold">{labels.principle} </span>
                                    <span className={`text-[10px] ${theme.accentText}`}>{item.band.didactic_principle}</span>
                                 </div>
                                 {item.band.fix && (
                                     <div>
                                        <span className="text-[8px] uppercase text-slate-500 font-bold block">{labels.intervention_label}</span>
                                        <p className="text-[10px] text-white leading-tight">{item.band.fix}</p>
                                     </div>
                                 )}
                             </div>
                        </div>
                    </details>
                ))}
            </div>
        )}

        {/* 5. Logic Log */}
        <div className={`pt-3 border-t ${theme.border}`}>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">{labels.internal_logic}</h3>
            <p className="text-[10px] text-slate-400 font-mono leading-relaxed bg-black/30 p-2 rounded border border-white/5">
                {analysis ? `> ${analysis.reasoning}` : labels.waiting}
            </p>
        </div>

        {/* Mechanical Footer & Context Load */}
        {mechanical && (
            <div className="pt-2 border-t border-white/5">
                 <div className="flex justify-between text-[8px] text-slate-500 uppercase font-mono mb-1">
                     <span>{labels.context_load}</span>
                     <span>{mechanical.inputTokens} toks</span>
                 </div>
                 <div className="h-1 bg-slate-800 rounded-full overflow-hidden w-full mb-2">
                     <div className="h-full bg-slate-600" style={{ width: `${contextLoadPct}%` }}></div>
                 </div>
                 <div className="text-[9px] text-slate-600 font-mono flex justify-between">
                    <span>Lat: {mechanical.latencyMs}ms</span>
                    <span>T: {mechanical.temperature}</span>
                </div>
            </div>
        )}
      </div>
      <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;