import React from 'react';
import { EAIAnalysis, MechanicalState, LearnerProfile } from '../types';
import { EAI_CORE, SSOTBand } from '../utils/ssotParser';
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
}

const MODE_ABBR: Record<string, string> = {
    'ANALYTISCH': 'ANALYT',
    'REFLECTIEF': 'REFL',
    'SYSTEMISCH': 'SYSTEM',
    'PRAGMATISCH': 'PRAGMA',
    'CREATIEF': 'CREATIE',
    'NORMATIEF': 'NORM',
    'ONBEKEND': '-'
};

const Dashboard: React.FC<DashboardProps> = ({ analysis, mechanical, isOpen, onClose, theme, isLoading = false, profile, eaiState }) => {
  
  // Helper to get full rich data from SSOT
  const getActiveBandDetails = (): { rubricName: string, band: SSOTBand }[] => {
    if (!analysis) return [];
    const activeCodes = [
        ...analysis.coregulation_bands,
        ...analysis.process_phases,
        ...analysis.task_densities
    ];

    const details: { rubricName: string, band: SSOTBand }[] = [];

    activeCodes.forEach(code => {
        EAI_CORE.rubrics.forEach(rubric => {
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
    ? EAI_CORE.commands.find(c => c.command === analysis.active_fix) 
    : null;

  // Layout container classes with dynamic theme
  // Increased z-index to 50 for mobile ensuring it's on top
  const containerClasses = `
    fixed inset-y-0 right-0 w-full sm:w-80 ${theme.sidebar} border-l ${theme.border} 
    z-50 transform transition-transform duration-300 ease-in-out flex flex-col
    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    lg:relative lg:translate-x-0 lg:w-80 lg:flex lg:z-0
  `;

  return (
    <div className={containerClasses}>
      
      {/* Header */}
      <div className={`h-14 flex items-center justify-between px-4 ${theme.bg} border-b ${theme.border} bg-opacity-50`}>
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-orange-400 animate-ping' : (analysis ? 'bg-green-500' : 'bg-red-500')}`}></div>
            <span className={`font-mono text-xs font-bold tracking-widest uppercase ${isLoading ? 'text-orange-400 animate-pulse' : 'text-slate-400'}`}>
                {isLoading ? 'SSOT UPLINK ACTIVE' : 'SSOT MONITOR'}
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

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide relative">
        
        {/* LOADING STATE OVERLAY */}
        {isLoading ? (
            <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-[2px] p-6 flex flex-col justify-center">
                
                {/* Scanner Line */}
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
                    <span className="uppercase font-bold text-[10px]">Huidig Profiel</span>
                 </div>
                 <div className="space-y-1.5 text-xs">
                     <div className="flex justify-between"><span className="opacity-50">Vak:</span> <span className="text-slate-200 font-medium">{profile.subject || '-'}</span></div>
                     <div className="flex justify-between"><span className="opacity-50">Niveau:</span> <span className="text-slate-200 font-medium">{profile.level || '-'}</span></div>
                     <div className="flex justify-between"><span className="opacity-50">Leerjaar:</span> <span className="text-slate-200 font-medium">{profile.grade || '-'}</span></div>
                     {profile.name && <div className="flex justify-between"><span className="opacity-50">Naam:</span> <span className="text-slate-200 font-medium">{profile.name}</span></div>}
                 </div>
            </div>
        )}

        {/* 0.5 EAI STATE KERNEL MONITOR */}
        {eaiState && (
            <div className="grid grid-cols-4 gap-1">
                <div className={`bg-white/5 border ${theme.border} rounded p-1.5 text-center flex flex-col justify-center`}>
                    <span className="text-[8px] text-slate-500 uppercase font-mono mb-0.5">Turn</span>
                    <span className="text-xs text-white font-bold font-mono">{eaiState.turn_counter}</span>
                </div>
                <div className={`bg-white/5 border ${theme.border} rounded p-1.5 text-center flex flex-col justify-center`}>
                    <span className="text-[8px] text-slate-500 uppercase font-mono mb-0.5">Phase</span>
                    <span className="text-xs text-cyan-400 font-bold font-mono">{eaiState.current_bands.P || '-'}</span>
                </div>
                <div className={`bg-white/5 border ${theme.border} rounded p-1.5 text-center flex flex-col justify-center`}>
                    <span className="text-[8px] text-slate-500 uppercase font-mono mb-0.5">Task</span>
                    <span className="text-xs text-orange-400 font-bold font-mono">{eaiState.current_bands.TD || '-'}</span>
                </div>
                <div className={`bg-white/5 border ${theme.border} rounded p-1.5 text-center flex flex-col justify-center`}>
                    <span className="text-[8px] text-slate-500 uppercase font-mono mb-0.5">Mode</span>
                    <span className="text-[9px] text-purple-400 font-bold uppercase truncate px-1">
                        {eaiState.cognitive_mode ? (MODE_ABBR[eaiState.cognitive_mode] || eaiState.cognitive_mode.slice(0, 5)) : '-'}
                    </span>
                </div>
            </div>
        )}

        {/* 1. ACTIVE INTERVENTION CARD (Dynamic Theme) */}
        {analysis?.active_fix ? (
            <div className={`border ${theme.border} bg-black/20 rounded-lg p-3 relative overflow-hidden ${theme.glow}`}>
                <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.accentText}`}>Actieve Interventie</span>
                </div>
                <div className="flex justify-between items-start gap-2 mb-2">
                     <p className="text-sm text-white font-bold leading-tight">
                        {activeFixDetails ? activeFixDetails.description : "Didactische bijsturing"}
                     </p>
                </div>
                <code className={`block w-full text-center ${theme.bg} ${theme.accentText} px-1.5 py-1 rounded text-[10px] font-mono border ${theme.border}`}>
                    {analysis.active_fix}
                </code>
            </div>
        ) : (
            <div className={`border ${theme.border} border-dashed bg-transparent rounded-lg p-4 text-center`}>
                <span className="text-[10px] text-slate-500 uppercase">Geen actieve interventie</span>
            </div>
        )}
            
        {/* 2. TASK DENSITY / AGENCY METER */}
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase">Taakdichtheid</h3>
                <span className={`text-[10px] font-mono font-bold ${theme.accentText}`}>{analysis?.task_density_balance ?? 70}%</span>
            </div>
            
            <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-900/40 via-blue-900/40 to-green-900/40"></div>
                <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(255,255,255,1)] transition-all duration-700 ease-out z-10"
                    style={{ left: `${analysis?.task_density_balance ?? 70}%` }}
                ></div>
            </div>
            <div className="flex justify-between text-[8px] text-slate-600 font-mono uppercase">
                <span>Passief (AI)</span>
                <span>Actief (Leerling)</span>
            </div>
        </div>

        {/* REMOVED: Duplicate Cognitive Status Grid (now in Kernel Monitor) */}

        {/* 4. DEEP SSOT ANALYSIS (Expandable Rich Data) */}
        {activeBands.length > 0 && (
            <div className={`space-y-3 pt-3 border-t ${theme.border}`}>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase">Observatie Details</h3>
                
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
                                        <span className="text-[8px] uppercase text-slate-500 font-bold block mb-0.5">Leerling gedrag:</span>
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
                                    <span className="text-[8px] uppercase text-slate-500 font-bold">Principe: </span>
                                    <span className={`text-[10px] ${theme.accentText}`}>{item.band.didactic_principle}</span>
                                 </div>
                                 {item.band.fix && (
                                     <div>
                                        <span className="text-[8px] uppercase text-slate-500 font-bold block">Interventie:</span>
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
            <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Internal Logic</h3>
            <p className="text-[10px] text-slate-400 font-mono leading-relaxed bg-black/30 p-2 rounded border border-white/5">
                {analysis ? `> ${analysis.reasoning}` : '> Waiting for stream...'}
            </p>
        </div>

        {/* Mechanical Footer */}
        {mechanical && (
            <div className="text-[9px] text-slate-600 font-mono flex justify-between pt-2">
                <span>Lat: {mechanical.latencyMs}ms</span>
                <span>Tok: {mechanical.outputTokens}</span>
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