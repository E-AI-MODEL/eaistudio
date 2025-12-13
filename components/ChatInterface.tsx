import React, { useState, useRef, useEffect } from 'react';
import { Message, EAIAnalysis, MechanicalState, LearnerProfile } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import MessageBubble from './MessageBubble';
import Dashboard from './Dashboard';
import GameNeuroLinker from './GameNeuroLinker';
import ProfileSetup from './ProfileSetup';
import {
  createInitialEAIState,
  updateStateFromAnalysis,
  validateAnalysisAgainstSSOT,
  EAIStateLike,
  quickCoreIntegrityCheck,
} from '../utils/eaiLearnAdapter';

// --- MOOD ENGINE CONFIGURATION ---
type Theme = {
    bg: string;
    sidebar: string;
    border: string;
    accent: string;
    accentText: string;
    buttonActive: string;
    bubbleUser: string;
    glow: string;
};

const THEMES: Record<string, Theme> = {
    DEFAULT: {
        bg: 'bg-[#0b1120]',
        sidebar: 'bg-[#0f172a]',
        border: 'border-slate-800',
        accent: 'bg-blue-600',
        accentText: 'text-blue-400',
        buttonActive: 'border-blue-500 bg-blue-500/10 text-blue-400',
        bubbleUser: 'bg-blue-600/10 border-blue-500/30 text-blue-100',
        glow: 'shadow-[0_0_20px_rgba(37,99,235,0.1)]'
    },
    DEVIL: { // Critical / Confrontational
        bg: 'bg-[#1a0505]',
        sidebar: 'bg-[#2a0a0a]',
        border: 'border-red-900',
        accent: 'bg-red-600',
        accentText: 'text-red-500',
        buttonActive: 'border-red-500 bg-red-500/10 text-red-400',
        bubbleUser: 'bg-red-600/10 border-red-500/30 text-red-100',
        glow: 'shadow-[0_0_30px_rgba(220,38,38,0.2)]'
    },
    META: { // Reflective / Deep
        bg: 'bg-[#0f0a1a]',
        sidebar: 'bg-[#150f25]',
        border: 'border-violet-900',
        accent: 'bg-violet-600',
        accentText: 'text-violet-400',
        buttonActive: 'border-violet-500 bg-violet-500/10 text-violet-400',
        bubbleUser: 'bg-violet-600/10 border-violet-500/30 text-violet-100',
        glow: 'shadow-[0_0_20px_rgba(124,58,237,0.15)]'
    },
    CREATIVE: { // Visual / Generative
        bg: 'bg-[#0f1012]',
        sidebar: 'bg-[#13151a]',
        border: 'border-fuchsia-900',
        accent: 'bg-fuchsia-600',
        accentText: 'text-fuchsia-400',
        buttonActive: 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-400',
        bubbleUser: 'bg-fuchsia-600/10 border-fuchsia-500/30 text-fuchsia-100',
        glow: 'shadow-[0_0_20px_rgba(192,38,233,0.15)]'
    },
    COACH: { // Safe / Guiding
        bg: 'bg-[#051a10]',
        sidebar: 'bg-[#062415]',
        border: 'border-emerald-900',
        accent: 'bg-emerald-600',
        accentText: 'text-emerald-400',
        buttonActive: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
        bubbleUser: 'bg-emerald-600/10 border-emerald-500/30 text-emerald-100',
        glow: 'shadow-[0_0_20px_rgba(5,150,105,0.15)]'
    },
    SYSTEM: { // Structural / Logic
        bg: 'bg-[#081a1a]',
        sidebar: 'bg-[#0a2020]',
        border: 'border-cyan-900',
        accent: 'bg-cyan-600',
        accentText: 'text-cyan-400',
        buttonActive: 'border-cyan-500 bg-cyan-500/10 text-cyan-400',
        bubbleUser: 'bg-cyan-600/10 border-cyan-500/30 text-cyan-100',
        glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]'
    },
    PRAGMATIC: { // Action / Concrete
        bg: 'bg-[#1a0f05]',
        sidebar: 'bg-[#261505]',
        border: 'border-orange-900',
        accent: 'bg-orange-600',
        accentText: 'text-orange-400',
        buttonActive: 'border-orange-500 bg-orange-500/10 text-orange-400',
        bubbleUser: 'bg-orange-600/10 border-orange-500/30 text-orange-100',
        glow: 'shadow-[0_0_20px_rgba(234,88,12,0.15)]'
    }
};

const TOOL_CATEGORIES = {
  START: [
    { label: "Bepaal doel", command: "/checkin", icon: "📍", desc: "Wat gaan we doen?", mode: "COACH" },
    { label: "Kernvraag", command: "/leervraag", icon: "💡", desc: "Wat is de essentie?", mode: "DEFAULT" },
    { label: "Proces check", command: "/fase_check", icon: "⏱️", desc: "Waar sta ik?", mode: "SYSTEM" },
    { label: "Help kiezen", command: "/keuze", icon: "🔀", desc: "Keuze-opties", mode: "PRAGMATIC" },
    { label: "Samenwerking", command: "/social_check", icon: "👥", desc: "Solo of groep?", mode: "COACH" },
  ],
  UITLEG: [
    { label: "Structureer", command: "/schema", icon: "📐", desc: "Tabel/Schema", mode: "SYSTEM" },
    { label: "Visualiseer", command: "/beeld", icon: "🎨", desc: "Metafoor", mode: "CREATIVE" },
    { label: "Begrippen", command: "/vocab", icon: "ABC", desc: "Definities", mode: "SYSTEM" },
    { label: "Opstarten", command: "/intro", icon: "🚀", desc: "Voorkennis ophalen", mode: "COACH" },
    { label: "Differentieer", command: "/diff", icon: "📶", desc: "3 niveaus uitleg", mode: "COACH" },
    { label: "Denkstappen", command: "/chain", icon: "👣", desc: "Toon logica", mode: "SYSTEM" },
  ],
  UITDAGEN: [
    { label: "Devil's Advocate", command: "/devil", icon: "😈", desc: "Tegenspraak", mode: "DEVIL" },
    { label: "Draai om", command: "/twist", icon: "🔄", desc: "Tegenovergesteld", mode: "DEVIL" },
    { label: "Vergelijk", command: "/vergelijk", icon: "⚖️", desc: "Analogie", mode: "SYSTEM" },
    { label: "Zoek fout", command: "/misvatting", icon: "🐞", desc: "Vind de fout", mode: "DEVIL" },
    { label: "Check bron", command: "/verify", icon: "🔍", desc: "Validatie", mode: "SYSTEM" },
    { label: "Rolwissel", command: "/rolwissel", icon: "🎭", desc: "Ander perspectief", mode: "CREATIVE" },
  ],
  CHECK: [
    { label: "Test mij", command: "/quizgen", icon: "📝", desc: "Quizvragen", mode: "COACH" },
    { label: "Samenvatten", command: "/beurtvraag", icon: "🎤", desc: "In 1 zin", mode: "PRAGMATIC" },
    { label: "Toepassen", command: "/transfeer", icon: "🌍", desc: "Praktijk", mode: "PRAGMATIC" },
    { label: "Lesgeven", command: "/teach", icon: "🎓", desc: "Leg het uit", mode: "CREATIVE" },
    { label: "Bewijs tegendeel", command: "/falsificatie", icon: "⚡", desc: "Falsificatie", mode: "DEVIL" },
  ],
  REFLECTIE: [
    { label: "Helikopter", command: "/meta", icon: "🧠", desc: "Proces review", mode: "META" },
    { label: "Score zelf", command: "/rubric", icon: "📊", desc: "Rubric", mode: "SYSTEM" },
    { label: "Evaluatie", command: "/proces_eval", icon: "🏁", desc: "Eindoordeel", mode: "META" },
    { label: "Leerwinst", command: "/afsluiter", icon: "💎", desc: "Wat neem je mee?", mode: "COACH" },
  ],
  PAUZE: [
    { label: "Neuro-Linker", command: "GAME_NEURO", icon: "💠", desc: "Sync netwerk", mode: "DEFAULT" },
  ]
};

const CYCLE_STEPS = [
    { id: 'P', label: 'Proces' },
    { id: 'TD', label: 'Taak' },
    { id: 'C', label: 'Regie' },
    { id: 'V', label: 'Skill' },
    { id: 'T', label: 'Tech' },
    { id: 'E', label: 'Epist' },
    { id: 'L', label: 'Transfer' }
];

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<keyof typeof TOOL_CATEGORIES>('START');
  const [showMobileDashboard, setShowMobileDashboard] = useState(false);
  const [isToolboxOpen, setToolboxOpen] = useState(false); 
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES.DEFAULT);
  const [showGame, setShowGame] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(true);
  
  const [currentAnalysis, setCurrentAnalysis] = useState<EAIAnalysis | null>(null);
  const [currentMechanical, setCurrentMechanical] = useState<MechanicalState | null>(null);
  
  // EAI State Kernel
  const [eaiState, setEaiState] = useState<EAIStateLike>(() => createInitialEAIState());

  // Persistent Profile State
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile>({
      name: null,
      subject: null,
      level: null,
      grade: null
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toolboxRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- PERSISTENCE: LOAD PROFILE ---
  useEffect(() => {
      const savedProfile = localStorage.getItem('eai_learner_profile');
      if (savedProfile) {
          try {
              const parsed = JSON.parse(savedProfile);
              setLearnerProfile(parsed);
          } catch (e) {
              console.error("Failed to load profile", e);
          }
      }
  }, []);

  // --- EAI KERNEL INTEGRITY CHECK ---
  useEffect(() => {
      const ok = quickCoreIntegrityCheck();
      if (!ok) {
        console.warn("EAI_CORE integrity check FAILED – SSOT seems incomplete or missing definitions.");
      } else {
        console.log("EAI_CORE integrity check OK – SSOT Architecture loaded.");
      }
  }, []);

  // --- COOL DOWN EFFECT ---
  // Automatically revert to DEFAULT theme after 5 seconds of inactivity on the theme
  useEffect(() => {
    if (currentTheme !== THEMES.DEFAULT) {
        const timer = setTimeout(() => {
            setCurrentTheme(THEMES.DEFAULT);
        }, 5000); // Wait 5 seconds before fading out

        return () => clearTimeout(timer);
    }
  }, [currentTheme]);


  // Close toolbox when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolboxRef.current && !toolboxRef.current.contains(event.target as Node) && isToolboxOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('#toolbox-toggle')) {
            setToolboxOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isToolboxOpen]);

  const updateTheme = (command: string) => {
      let newMode = 'DEFAULT';
      Object.values(TOOL_CATEGORIES).flat().forEach(tool => {
          if (tool.command === command) newMode = tool.mode;
      });
      setCurrentTheme(THEMES[newMode] || THEMES.DEFAULT);
  };

  const handleResetSession = () => {
      setMessages([]);
      setCurrentAnalysis(null);
      setCurrentMechanical(null);
      setEaiState(createInitialEAIState());
      setCurrentTheme(THEMES.DEFAULT);
      setToolboxOpen(false);
      setShowProfileSetup(true);
  };

  const handleProfileComplete = async (profile: LearnerProfile, goal: string) => {
      // 1. Save Profile
      setLearnerProfile(profile);
      localStorage.setItem('eai_learner_profile', JSON.stringify(profile));
      setShowProfileSetup(false);

      // 2. Add System/User Context Message (Invisible or Visible representation)
      // We will create a visible prompt that acts as the user starting the session
      const startText = `[Systeem Start]
Naam: ${profile.name}
Niveau: ${profile.level}, Leerjaar ${profile.grade}
Vak: ${profile.subject}
Doel: ${goal}

INSTRUCTIE: Je blijft gedurende de HELE sessie in de rol die past bij dit niveau. Pas je antwoorden en vragen strikt aan op ${profile.level} leerjaar ${profile.grade}.`;

      const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          text: goal, // Display just the goal to the user to keep it clean
          timestamp: new Date()
      };
      setMessages([userMessage]);
      setIsLoading(true);

      // 3. Send the full context to AI
      try {
          const response = await sendMessageToGemini(startText);
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: response.text,
            timestamp: new Date(),
            analysis: response.analysis,
            mechanical: response.mechanical,
          };
          
          setMessages(prev => [...prev, aiMessage]);
          setCurrentAnalysis(response.analysis);
          setCurrentMechanical(response.mechanical);
          
          // Update EAI State
          setEaiState(prev => updateStateFromAnalysis(prev, response.analysis, response.mechanical));

      } catch (error) {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: "System Failure: Kon sessie niet initialiseren.",
            timestamp: new Date(),
            isError: true,
          };
          setMessages(prev => [...prev, errorMessage]);
      } finally {
          setIsLoading(false);
      }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || inputText;

    // Special case for GAME
    if (textToSend === 'GAME_NEURO') {
        setShowGame(true);
        setToolboxOpen(false);
        return;
    }

    if (!textToSend.trim() || isLoading) return;

    if (textOverride) {
        updateTheme(textOverride);
        setToolboxOpen(false); 
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendMessageToGemini(userMessage.text);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        timestamp: new Date(),
        analysis: response.analysis,
        mechanical: response.mechanical,
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      setCurrentAnalysis(response.analysis);
      setCurrentMechanical(response.mechanical);

      // --- EAI KERNEL UPDATE ---
      const validation = validateAnalysisAgainstSSOT(response.analysis);
      if (!validation.ok) {
          console.warn("SSOT Mismatch detected:", validation);
      }
      setEaiState(prev => updateStateFromAnalysis(prev, response.analysis, response.mechanical));


      // --- PERSISTENCE: UPDATE PROFILE (Accumulative) ---
      if (response.analysis.current_profile) {
          const newProfile = response.analysis.current_profile;
          const updatedProfile = { ...learnerProfile };
          let hasChanges = false;

          // Only update if new value is truthy (don't overwrite with nulls if we have data)
          if (newProfile.name) { updatedProfile.name = newProfile.name; hasChanges = true; }
          if (newProfile.subject) { updatedProfile.subject = newProfile.subject; hasChanges = true; }
          if (newProfile.level) { updatedProfile.level = newProfile.level; hasChanges = true; }
          if (newProfile.grade) { updatedProfile.grade = newProfile.grade; hasChanges = true; }

          if (hasChanges) {
              setLearnerProfile(updatedProfile);
              localStorage.setItem('eai_learner_profile', JSON.stringify(updatedProfile));
          }
      }

      if (!textOverride && response.analysis.active_fix) {
          const fix = response.analysis.active_fix;
          if (fix.includes('devil')) setCurrentTheme(THEMES.DEVIL);
          else if (fix.includes('meta') || fix.includes('ref')) setCurrentTheme(THEMES.META);
          else if (fix.includes('checkin') || fix.includes('quiz')) setCurrentTheme(THEMES.COACH);
          else if (fix.includes('beeld')) setCurrentTheme(THEMES.CREATIVE);
          else if (fix.includes('schema') || fix.includes('fase') || fix.includes('rubric')) setCurrentTheme(THEMES.SYSTEM);
          else if (fix.includes('keuze') || fix.includes('transfeer')) setCurrentTheme(THEMES.PRAGMATIC);
          else setCurrentTheme(THEMES.DEFAULT);
      } 

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "System Failure: Kon geen verbinding maken met de neural core.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const isStepActive = (stepPrefix: string) => {
      if (!currentAnalysis) return false;
      const combined = [
          ...currentAnalysis.process_phases,
          ...currentAnalysis.coregulation_bands,
          ...currentAnalysis.task_densities
      ];
      return combined.some(code => code.startsWith(stepPrefix));
  };

  return (
    // Added duration-[2000ms] for a very slow, gentle fade when theme resets
    <div className={`flex h-screen ${currentTheme.bg} text-slate-200 overflow-hidden font-sans transition-colors duration-[2000ms]`}>
      
      <ProfileSetup isOpen={showProfileSetup} onComplete={handleProfileComplete} />
      {showGame && <GameNeuroLinker onClose={() => setShowGame(false)} />}

      {/* LEFT PANE: Context & Cycle */}
      <div className={`hidden lg:flex w-64 flex-col border-r ${currentTheme.border} ${currentTheme.sidebar} transition-colors duration-[2000ms]`}>
        <div className={`p-4 border-b ${currentTheme.border} transition-colors duration-[2000ms]`}>
             <div className="flex items-center gap-3 mb-1">
                <div className={`w-8 h-8 ${currentTheme.accent} rounded flex items-center justify-center font-bold text-white ${currentTheme.glow} transition-all duration-[2000ms]`}>
                    EAI
                </div>
                <span className="font-bold tracking-tight text-white">Studio v12.3</span>
             </div>
             <div className="text-[10px] text-slate-500 font-mono">
                SECURE CONNECTION
             </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Leercyclus</h3>
            <div className="space-y-1 relative">
                <div className={`absolute left-3 top-2 bottom-2 w-px ${currentTheme.border} opacity-50 z-0 transition-colors duration-[2000ms]`}></div>
                {CYCLE_STEPS.map((step) => {
                    const active = isStepActive(step.id);
                    return (
                        <div key={step.id} className="relative z-10 flex items-center gap-3 p-2 rounded transition-all">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors duration-[2000ms] ${active ? `${currentTheme.accent} border-white/20 text-white ${currentTheme.glow}` : `${currentTheme.bg} ${currentTheme.border} text-slate-500`}`}>
                                {step.id}
                            </div>
                            <span className={`text-sm ${active ? 'text-white font-medium' : 'text-slate-500'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>

        <div className={`p-4 border-t ${currentTheme.border} bg-black/20 transition-colors duration-[2000ms]`}>
             <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                <span className="uppercase font-bold text-[10px]">Huidig Profiel</span>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
             </div>
             <div className="space-y-1 text-xs">
                 <div className="flex justify-between"><span className="opacity-50">Vak:</span> <span className="text-slate-200">{learnerProfile.subject || '-'}</span></div>
                 <div className="flex justify-between"><span className="opacity-50">Niveau:</span> <span className="text-slate-200">{learnerProfile.level || '-'}</span></div>
                 <div className="flex justify-between"><span className="opacity-50">Leerjaar:</span> <span className="text-slate-200">{learnerProfile.grade || '-'}</span></div>
                 {learnerProfile.name && <div className="flex justify-between"><span className="opacity-50">Naam:</span> <span className="text-slate-200">{learnerProfile.name}</span></div>}
             </div>
        </div>
      </div>

      {/* CENTER PANE: The Workbench */}
      <div className={`flex-1 flex flex-col min-w-0 ${currentTheme.bg} relative transition-colors duration-[2000ms]`}>
        
        {/* Top Status Bar */}
        <div className={`h-14 border-b ${currentTheme.border} flex items-center justify-between px-4 lg:px-6 backdrop-blur-md sticky top-0 z-20 bg-opacity-80 ${currentTheme.sidebar} transition-colors duration-[2000ms]`}>
            <div className="flex items-center gap-2 lg:hidden">
                <div className={`w-6 h-6 ${currentTheme.accent} rounded flex items-center justify-center font-bold text-white text-xs`}>EAI</div>
                <span className="font-bold text-sm text-white">Studio</span>
            </div>
            
            <div className="hidden lg:flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="font-mono text-xs text-slate-400">
                    SYSTEM STATUS: <span className={`${currentTheme.accentText} font-bold transition-colors duration-[2000ms]`}>ACTIVE</span>
                 </span>
            </div>

            <div className="flex items-center gap-2">
                {/* Reset Button */}
                <button 
                    onClick={handleResetSession}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                    title="Nieuwe Sessie (Reset)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                </button>

                <button 
                    onClick={() => setShowMobileDashboard(true)}
                    className="lg:hidden text-slate-400 hover:text-white p-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
            </div>
        </div>

        {/* Interaction Log */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide relative" onClick={() => setToolboxOpen(false)}>
             <div className="max-w-3xl mx-auto space-y-6">
                
                {messages.length === 0 && !showProfileSetup && (
                     <div className="flex flex-col items-center justify-center h-64 text-slate-500 opacity-50">
                         <span className="text-4xl mb-2">💠</span>
                         <span className="text-sm font-mono">NEURAL CORE STANDBY</span>
                     </div>
                )}

                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} themeClasses={currentTheme.bubbleUser} />
                ))}
                
                {isLoading && (
                    <div className="flex items-center gap-3 text-slate-500 pl-4 animate-pulse">
                         <div className={`w-2 h-2 ${currentTheme.accent} rounded-full`}></div>
                         <span className={`text-xs font-mono uppercase ${currentTheme.accentText}`}>Neural Processing...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
             </div>
        </div>

        {/* THE FLOATING INPUT & DRAWER */}
        <div className={`p-4 lg:p-6 z-30 relative`}>
            <div className="max-w-3xl mx-auto relative">
                
                {/* 1. THE POP-UP TOOLBOX DRAWER */}
                <div 
                    ref={toolboxRef}
                    className={`absolute bottom-full left-0 right-0 mb-3 bg-[#1e293b]/95 backdrop-blur-xl border ${currentTheme.border} rounded-xl shadow-2xl transition-all duration-300 transform origin-bottom overflow-hidden flex flex-col ${isToolboxOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 translate-y-8 pointer-events-none'}`}
                    style={{ maxHeight: '60vh' }}
                >
                    {/* Drawer Header */}
                    <div className={`flex items-center justify-between px-4 py-3 border-b ${currentTheme.border} bg-black/20 transition-colors duration-[2000ms]`}>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Gereedschapskist</span>
                        <button onClick={() => setToolboxOpen(false)} className="text-slate-400 hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide p-2 pb-0">
                        {Object.keys(TOOL_CATEGORIES).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat as keyof typeof TOOL_CATEGORIES)}
                                className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all rounded-lg whitespace-nowrap ${
                                    activeTab === cat 
                                    ? `${currentTheme.accent} text-white shadow-md` 
                                    : 'text-slate-400 hover:bg-white/5'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Tool Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 overflow-y-auto max-h-64 scrollbar-hide">
                        {TOOL_CATEGORIES[activeTab].map((tool) => (
                            <button
                                key={tool.command}
                                onClick={() => handleSendMessage(tool.command)}
                                className={`flex flex-col items-start p-3 rounded-lg border transition-all group text-left bg-black/20 ${currentTheme.border} hover:bg-white/10 active:scale-95`}
                                disabled={isLoading}
                            >
                                <div className="flex items-center gap-2 w-full mb-1">
                                    <span className="text-lg">{tool.icon}</span>
                                    <span className="text-xs font-bold text-slate-200 group-hover:text-white">{tool.label}</span>
                                </div>
                                <span className="text-[9px] text-slate-500 leading-tight">{tool.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. THE MAIN INPUT BAR */}
                <div className={`flex items-center gap-2 bg-black/40 border ${currentTheme.border} rounded-xl p-2 shadow-lg backdrop-blur-sm transition-all focus-within:ring-1 focus-within:ring-white/20 duration-[2000ms]`}>
                    
                    {/* Toggle Button for Toolbox */}
                    <button
                        id="toolbox-toggle"
                        onClick={() => setToolboxOpen(!isToolboxOpen)}
                        className={`p-3 rounded-lg transition-all ${isToolboxOpen ? currentTheme.accent + ' text-white rotate-45' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        title="Open gereedschapskist"
                    >
                         {isToolboxOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                            </svg>
                         ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                             </svg>
                         )}
                    </button>

                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                        placeholder="Typ uw bericht..."
                        className="flex-1 bg-transparent border-none text-sm text-white placeholder-slate-500 focus:ring-0 py-2 font-medium"
                        disabled={isLoading}
                        autoComplete="off"
                    />

                    <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputText.trim() || isLoading}
                        className={`p-2 rounded-lg transition-all ${!inputText.trim() ? 'text-slate-600 cursor-not-allowed' : `${currentTheme.accentText} hover:bg-white/10`}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 004.82 9.25h8.138a1.5 1.5 0 010 3H4.82a1.5 1.5 0 00-1.127 1.086l-1.414 4.926a.75.75 0 00.972.965l15-6a.75.75 0 000-1.386l-15-6z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* RIGHT PANE: SSOT Monitor */}
      <Dashboard 
        analysis={currentAnalysis} 
        mechanical={currentMechanical}
        isOpen={showMobileDashboard} 
        onClose={() => setShowMobileDashboard(false)}
        theme={currentTheme}
        isLoading={isLoading}
        profile={learnerProfile}
        eaiState={eaiState}
      />
      
    </div>
  );
};

export default ChatInterface;