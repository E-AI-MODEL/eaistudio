import React, { useState, useRef, useEffect } from 'react';
import { Message, EAIAnalysis, MechanicalState, LearnerProfile } from '../types';
import { sendMessageToGemini, resetChatSession } from '../services/geminiService';
import MessageBubble from './MessageBubble';
import Dashboard from './Dashboard';
import GameNeuroLinker from './GameNeuroLinker';
import ProfileSetup from './ProfileSetup';
import BootSequence from './BootSequence';
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

const CYCLE_STEPS = [
    { id: 'P', label: 'Proces' },
    { id: 'TD', label: 'Taak' },
    { id: 'C', label: 'Regie' },
    { id: 'V', label: 'Skill' },
    { id: 'T', label: 'Tech' },
    { id: 'E', label: 'Epist' },
    { id: 'L', label: 'Transfer' }
];

// Translation map for the toolbox categories
const TAB_LABELS: Record<string, { nl: string, en: string }> = {
    START: { nl: "Start", en: "Start" },
    UITLEG: { nl: "Uitleg", en: "Explain" },
    UITDAGEN: { nl: "Uitdagen", en: "Challenge" },
    CHECK: { nl: "Check", en: "Verify" },
    REFLECTIE: { nl: "Reflectie", en: "Reflect" },
    PAUZE: { nl: "Pauze", en: "Break" }
};

// Tool Categories with multi-language support labels
const GET_TOOL_CATEGORIES = (lang: 'nl' | 'en') => {
    const isEn = lang === 'en';
    return {
        START: [
            { label: isEn ? "Set Goal" : "Bepaal doel", command: "/checkin", icon: "📍", desc: isEn ? "What are we doing?" : "Wat gaan we doen?", mode: "COACH" },
            { label: isEn ? "Core Question" : "Kernvraag", command: "/leervraag", icon: "💡", desc: isEn ? "What is the essence?" : "Wat is de essentie?", mode: "DEFAULT" },
            { label: isEn ? "Process Check" : "Proces check", command: "/fase_check", icon: "⏱️", desc: isEn ? "Where do I stand?" : "Waar sta ik?", mode: "SYSTEM" },
            { label: isEn ? "Help Choose" : "Help kiezen", command: "/keuze", icon: "🔀", desc: isEn ? "Choice options" : "Keuze-opties", mode: "PRAGMATIC" },
            { label: isEn ? "Collaboration" : "Samenwerking", command: "/social_check", icon: "👥", desc: isEn ? "Solo or group?" : "Solo of groep?", mode: "COACH" },
        ],
        UITLEG: [
            { label: isEn ? "Structure" : "Structureer", command: "/schema", icon: "📐", desc: isEn ? "Table/Schema" : "Tabel/Schema", mode: "SYSTEM" },
            { label: isEn ? "Visualize" : "Visualiseer", command: "/beeld", icon: "🎨", desc: isEn ? "Metaphor" : "Metafoor", mode: "CREATIVE" },
            { label: isEn ? "Definitions" : "Begrippen", command: "/vocab", icon: "ABC", desc: isEn ? "Definitions" : "Definities", mode: "SYSTEM" },
            { label: isEn ? "Startup" : "Opstarten", command: "/intro", icon: "🚀", desc: isEn ? "Prior knowledge" : "Voorkennis ophalen", mode: "COACH" },
            { label: isEn ? "Differentiate" : "Differentieer", command: "/diff", icon: "📶", desc: isEn ? "3 levels explanation" : "3 niveaus uitleg", mode: "COACH" },
            { label: isEn ? "Think Steps" : "Denkstappen", command: "/chain", icon: "👣", desc: isEn ? "Show logic" : "Toon logica", mode: "SYSTEM" },
        ],
        UITDAGEN: [
            { label: isEn ? "Devil's Advocate" : "Devil's Advocate", command: "/devil", icon: "😈", desc: isEn ? "Contradiction" : "Tegenspraak", mode: "DEVIL" },
            { label: isEn ? "Flip" : "Draai om", command: "/twist", icon: "🔄", desc: isEn ? "Opposite" : "Tegenovergesteld", mode: "DEVIL" },
            { label: isEn ? "Compare" : "Vergelijk", command: "/vergelijk", icon: "⚖️", desc: isEn ? "Analogy" : "Analogie", mode: "SYSTEM" },
            { label: isEn ? "Find Error" : "Zoek fout", command: "/misvatting", icon: "🐞", desc: isEn ? "Find the error" : "Vind de fout", mode: "DEVIL" },
            { label: isEn ? "Check Source" : "Check bron", command: "/verify", icon: "🔍", desc: isEn ? "Validation" : "Validatie", mode: "SYSTEM" },
            { label: isEn ? "Role Switch" : "Rolwissel", command: "/rolwissel", icon: "🎭", desc: isEn ? "Other perspective" : "Ander perspectief", mode: "CREATIVE" },
        ],
        CHECK: [
            { label: isEn ? "Test Me" : "Test mij", command: "/quizgen", icon: "📝", desc: isEn ? "Quiz questions" : "Quizvragen", mode: "COACH" },
            { label: isEn ? "Summarize" : "Samenvatten", command: "/beurtvraag", icon: "🎤", desc: isEn ? "In 1 sentence" : "In 1 zin", mode: "PRAGMATIC" },
            { label: isEn ? "Apply" : "Toepassen", command: "/transfeer", icon: "🌍", desc: isEn ? "Practice" : "Praktijk", mode: "PRAGMATIC" },
            { label: isEn ? "Teach" : "Lesgeven", command: "/teach", icon: "🎓", desc: isEn ? "Explain it" : "Leg het uit", mode: "CREATIVE" },
            { label: isEn ? "Falsify" : "Bewijs tegendeel", command: "/falsificatie", icon: "⚡", desc: isEn ? "Falsification" : "Falsificatie", mode: "DEVIL" },
        ],
        REFLECTIE: [
            { label: isEn ? "Helicopter" : "Helikopter", command: "/meta", icon: "🧠", desc: isEn ? "Process review" : "Proces review", mode: "META" },
            { label: isEn ? "Score Self" : "Score zelf", command: "/rubric", icon: "📊", desc: isEn ? "Rubric" : "Rubric", mode: "SYSTEM" },
            { label: isEn ? "Evaluation" : "Evaluatie", command: "/proces_eval", icon: "🏁", desc: isEn ? "Final verdict" : "Eindoordeel", mode: "META" },
            { label: isEn ? "Learning Gain" : "Leerwinst", command: "/afsluiter", icon: "💎", desc: isEn ? "Takeaway" : "Wat neem je mee?", mode: "COACH" },
        ],
        PAUZE: [
            { label: isEn ? "Neuro-Linker" : "Neuro-Linker", command: "GAME_NEURO", icon: "💠", desc: isEn ? "Focus Game" : "Focus Spel", mode: "DEFAULT" },
        ]
    };
};

type ToolCategoryKey = 'START' | 'UITLEG' | 'UITDAGEN' | 'CHECK' | 'REFLECTIE' | 'PAUZE';

// NEW: Mobile Tab State
type MobileTab = 'chat' | 'dashboard' | 'tools';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ToolCategoryKey>('START');
  
  // Replaced showMobileDashboard with activeMobileTab
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('chat');
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  
  // On Desktop, toolbox is a popover. On Mobile, it's a tab.
  const [isToolboxOpen, setToolboxOpen] = useState(false); 

  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES.DEFAULT);
  const [showGame, setShowGame] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(true);
  const [isBooting, setIsBooting] = useState(true);
  
  const [language, setLanguage] = useState<'nl' | 'en'>('nl');
  
  const [currentAnalysis, setCurrentAnalysis] = useState<EAIAnalysis | null>(null);
  const [currentMechanical, setCurrentMechanical] = useState<MechanicalState | null>(null);
  
  const [eaiState, setEaiState] = useState<EAIStateLike>(() => createInitialEAIState());

  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile>({
      name: null,
      subject: null,
      level: null,
      grade: null
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toolboxRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Only scroll if we are in chat mode to avoid jumping when switching tabs
    if (activeMobileTab === 'chat' || window.innerWidth >= 1024) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeMobileTab]);

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

  useEffect(() => {
      quickCoreIntegrityCheck();
  }, []);

  useEffect(() => {
    if (currentTheme !== THEMES.DEFAULT) {
        const timer = setTimeout(() => {
            setCurrentTheme(THEMES.DEFAULT);
        }, 5000);

        return () => clearTimeout(timer);
    }
  }, [currentTheme]);

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
      const tools = Object.values(GET_TOOL_CATEGORIES(language)).flat();
      tools.forEach(tool => {
          if (tool.command === command) newMode = tool.mode;
      });
      setCurrentTheme(THEMES[newMode] || THEMES.DEFAULT);
  };

  const handleMobileTabSwitch = (tab: MobileTab) => {
      if (activeMobileTab === tab) return;
      setIsTabSwitching(true);
      setTimeout(() => {
          setActiveMobileTab(tab);
          setTimeout(() => {
            setIsTabSwitching(false);
          }, 100);
      }, 600);
  };

  const handleResetSession = () => {
      setMessages([]);
      setCurrentAnalysis(null);
      setCurrentMechanical(null);
      setEaiState(createInitialEAIState());
      setCurrentTheme(THEMES.DEFAULT);
      setToolboxOpen(false);
      setShowProfileSetup(true);
      resetChatSession();
      setActiveMobileTab('chat');
  };

  const handleLanguageToggle = () => {
      const newLang = language === 'nl' ? 'en' : 'nl';
      setLanguage(newLang);
      setMessages([]);
      setCurrentAnalysis(null);
      setCurrentMechanical(null);
      setEaiState(createInitialEAIState());
      setCurrentTheme(THEMES.DEFAULT);
      setToolboxOpen(false);
      setShowProfileSetup(true);
      resetChatSession();
      setActiveMobileTab('chat');
  };

  const handleProfileComplete = async (profile: LearnerProfile, goal: string) => {
      setLearnerProfile(profile);
      localStorage.setItem('eai_learner_profile', JSON.stringify(profile));
      setShowProfileSetup(false);

      const startTextNL = `[Systeem Start]
Naam: ${profile.name}
Niveau: ${profile.level}, Leerjaar ${profile.grade}
Vak: ${profile.subject}
Doel: ${goal}

INSTRUCTIE: Je blijft gedurende de HELE sessie in de rol die past bij dit niveau. Pas je antwoorden en vragen strikt aan op ${profile.level} leerjaar ${profile.grade}.`;

      const startTextEN = `[System Start]
Name: ${profile.name}
Level: ${profile.level}, Grade: ${profile.grade}
Subject: ${profile.subject}
Goal: ${goal}

INSTRUCTION: Remain in the role appropriate for this level throughout the ENTIRE session. Adapt your answers and questions strictly to ${profile.level} grade ${profile.grade}.`;

      const startText = language === 'en' ? startTextEN : startTextNL;

      const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          text: goal, 
          timestamp: new Date()
      };
      setMessages([userMessage]);
      setIsLoading(true);

      try {
          const response = await sendMessageToGemini(startText, language);
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
          setEaiState(prev => updateStateFromAnalysis(prev, response.analysis, response.mechanical));

      } catch (error) {
          const errorText = language === 'en' ? "System Failure: Could not initialize session." : "System Failure: Kon sessie niet initialiseren.";
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: errorText,
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

    if (textToSend === 'GAME_NEURO') {
        setShowGame(true);
        setToolboxOpen(false);
        return;
    }

    if (!textToSend.trim() || isLoading) return;

    // If coming from tools tab on mobile, switch back to chat
    if (activeMobileTab !== 'chat') {
        handleMobileTabSwitch('chat');
    }

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
      const response = await sendMessageToGemini(userMessage.text, language);
      
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

      const validation = validateAnalysisAgainstSSOT(response.analysis);
      if (!validation.ok) {
          console.warn("SSOT Mismatch detected:", validation);
      }
      setEaiState(prev => updateStateFromAnalysis(prev, response.analysis, response.mechanical));

      if (response.analysis.current_profile) {
          const newProfile = response.analysis.current_profile;
          const updatedProfile = { ...learnerProfile };
          let hasChanges = false;
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
      const errorText = language === 'en' ? "System Failure: Could not connect to neural core." : "System Failure: Kon geen verbinding maken met de neural core.";
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: errorText,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplainAnalysis = () => {
    if (!currentAnalysis) return;
    const level = learnerProfile.level || (language === 'en' ? 'student' : 'leerling');
    const promptNL = `Leg in begrijpelijke taal uit wat jouw EAI-analyse is van dit gesprek tot nu toe. Wat observeer je en waarom doe je wat je doet? Leg het uit voor een ${level}-leerling.`;
    const promptEN = `Explain in simple terms what your EAI analysis of this conversation is so far. What do you observe and why do you do what you do? Explain it for a ${level} student.`;
    
    handleSendMessage(language === 'en' ? promptEN : promptNL);
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

  const toolCategories = GET_TOOL_CATEGORIES(language);

  return (
    <div className={`flex h-screen ${currentTheme.bg} text-slate-200 overflow-hidden font-sans transition-colors duration-[2000ms] relative`}>
      
      {/* TAB SWITCHING ANIMATION OVERLAY */}
      {isTabSwitching && (
        <div className="absolute inset-0 z-50 bg-[#0b1120] flex items-center justify-center animate-in fade-in duration-200">
             <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full animate-[spin_1s_linear_infinite]"></div>
                <div className="absolute inset-2 border border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-[spin_0.5s_linear_infinite]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white tracking-widest animate-pulse">EAI</span>
                </div>
            </div>
        </div>
      )}

      {isBooting && <BootSequence onComplete={() => setIsBooting(false)} />}

      <ProfileSetup 
        isOpen={!isBooting && showProfileSetup} 
        onComplete={handleProfileComplete} 
        language={language}
        onLanguageChange={handleLanguageToggle}
        currentProfile={learnerProfile}
      />
      {showGame && <GameNeuroLinker onClose={() => setShowGame(false)} />}

      {/* LEFT PANE: Desktop Only */}
      <div className={`hidden lg:flex w-64 flex-col border-r ${currentTheme.border} ${currentTheme.sidebar} transition-colors duration-[2000ms]`}>
        <div className={`p-4 border-b ${currentTheme.border} transition-colors duration-[2000ms]`}>
             <div className="flex items-center justify-between mb-1">
                 <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${currentTheme.accent} rounded flex items-center justify-center font-bold text-white ${currentTheme.glow} transition-all duration-[2000ms]`}>
                        EAI
                    </div>
                    <span className="font-bold tracking-tight text-white">Studio v12.3</span>
                 </div>
                 <button 
                    onClick={handleLanguageToggle}
                    className="text-[10px] font-bold px-2 py-1 bg-white/5 rounded border border-white/10 hover:bg-white/10 transition-colors"
                    title={language === 'nl' ? 'Switch to English' : 'Schakel naar Nederlands'}
                 >
                     {language === 'nl' ? 'EN' : 'NL'}
                 </button>
             </div>
             <div className="text-[10px] text-slate-500 font-mono">SECURE CONNECTION</div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                {language === 'en' ? 'Learning Cycle' : 'Leercyclus'}
            </h3>
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
                <span className="uppercase font-bold text-[10px]">{language === 'en' ? 'Current Profile' : 'Huidig Profiel'}</span>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
             </div>
             <div className="space-y-1 text-xs">
                 <div className="flex justify-between"><span className="opacity-50">{language === 'en' ? 'Subject' : 'Vak'}:</span> <span className="text-slate-200">{learnerProfile.subject || '-'}</span></div>
                 <div className="flex justify-between"><span className="opacity-50">{language === 'en' ? 'Level' : 'Niveau'}:</span> <span className="text-slate-200">{learnerProfile.level || '-'}</span></div>
                 <div className="flex justify-between"><span className="opacity-50">{language === 'en' ? 'Grade' : 'Leerjaar'}:</span> <span className="text-slate-200">{learnerProfile.grade || '-'}</span></div>
                 {learnerProfile.name && <div className="flex justify-between"><span className="opacity-50">{language === 'en' ? 'Name' : 'Naam'}:</span> <span className="text-slate-200">{learnerProfile.name}</span></div>}
             </div>
        </div>
      </div>

      {/* CENTER PANE: Chat */}
      {/* Logic: Always show on desktop. On mobile, only show if tab is 'chat'. */}
      <div className={`flex-1 flex flex-col min-w-0 ${currentTheme.bg} relative transition-colors duration-[2000ms] 
         ${activeMobileTab === 'chat' ? 'flex' : 'hidden lg:flex'}`}>
        
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
                {/* Explain Analysis Button */}
                <button
                    onClick={handleExplainAnalysis}
                    disabled={!currentAnalysis || isLoading}
                    className={`hidden sm:flex p-2 rounded-lg transition-colors ${!currentAnalysis || isLoading ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-cyan-400 hover:bg-white/5'}`}
                    title={language === 'en' ? "Explain Analysis (Meta)" : "Leg analyse uit (Meta)"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                </button>

                {/* Reset Button */}
                <button 
                    onClick={handleResetSession}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                    title={language === 'en' ? "New Session (Reset)" : "Nieuwe Sessie (Reset)"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                </button>
            </div>
        </div>

        {/* Interaction Log */}
        {/* pb-20 added to clear bottom mobile nav */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide relative pb-20 lg:pb-6" onClick={() => setToolboxOpen(false)}>
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

        {/* INPUT BAR */}
        {/* mb-16 added to clear bottom mobile nav */}
        <div className={`p-4 lg:p-6 z-30 relative mb-16 lg:mb-0`}>
            <div className="max-w-3xl mx-auto relative">
                
                {/* TOOLBOX DRAWER (DESKTOP ONLY) */}
                <div 
                    ref={toolboxRef}
                    className={`hidden lg:flex absolute bottom-full left-0 right-0 mb-3 bg-[#1e293b]/95 backdrop-blur-xl border ${currentTheme.border} rounded-xl shadow-2xl transition-all duration-300 transform origin-bottom overflow-hidden flex-col ${isToolboxOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 translate-y-8 pointer-events-none'}`}
                    style={{ maxHeight: '60vh' }}
                >
                    <div className={`flex items-center justify-between px-4 py-3 border-b ${currentTheme.border} bg-black/20 transition-colors duration-[2000ms]`}>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{language === 'en' ? 'Toolbox' : 'Gereedschapskist'}</span>
                        <button onClick={() => setToolboxOpen(false)} className="text-slate-400 hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide p-2 pb-0">
                        {Object.keys(toolCategories).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat as ToolCategoryKey)}
                                className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all rounded-lg whitespace-nowrap ${
                                    activeTab === cat 
                                    ? `${currentTheme.accent} text-white shadow-md` 
                                    : 'text-slate-400 hover:bg-white/5'
                                }`}
                            >
                                {TAB_LABELS[cat] ? TAB_LABELS[cat][language] : cat}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-3 overflow-y-auto max-h-64 scrollbar-hide">
                        {(toolCategories[activeTab] || []).map((tool) => (
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

                {/* THE MAIN INPUT BAR */}
                <div className={`flex items-center gap-2 bg-black/40 border ${currentTheme.border} rounded-xl p-2 shadow-lg backdrop-blur-sm transition-all focus-within:ring-1 focus-within:ring-white/20 duration-[2000ms]`}>
                    
                    {/* Toggle Button for Toolbox (Desktop Only) */}
                    <button
                        id="toolbox-toggle"
                        onClick={() => setToolboxOpen(!isToolboxOpen)}
                        className={`hidden lg:block p-3 rounded-lg transition-all ${isToolboxOpen ? currentTheme.accent + ' text-white rotate-45' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        title={language === 'en' ? "Open Toolbox" : "Open gereedschapskist"}
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
                        placeholder={language === 'en' ? "Type your message..." : "Typ uw bericht..."}
                        /* Anti-Zoom fix: text-base on mobile (16px), text-sm on desktop */
                        className="flex-1 bg-transparent border-none text-base lg:text-sm text-white placeholder-slate-500 focus:ring-0 py-2 font-medium"
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

      {/* MOBILE TOOLS VIEW (Replaces drawer on mobile) */}
      {activeMobileTab === 'tools' && (
          <div className={`flex-1 flex flex-col lg:hidden ${currentTheme.bg} pb-24 overflow-hidden relative`}>
                
                {/* Header (Sticky) */}
                <div className={`sticky top-0 z-10 flex flex-col ${currentTheme.bg}/95 backdrop-blur-md border-b ${currentTheme.border}`}>
                    <div className="h-14 flex items-center px-4 justify-between">
                         <div className="flex items-center gap-2">
                             <div className={`w-5 h-5 rounded ${currentTheme.accent} flex items-center justify-center`}>
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3">
                                    <path fillRule="evenodd" d="M2 10a.75.75 0 01.75-.75h12.59l-2.1-1.95a.75.75 0 111.02-1.1l3.5 3.25a.75.75 0 010 1.1l-3.5 3.25a.75.75 0 11-1.02-1.1l2.1-1.95H2.75A.75.75 0 012 10z" clipRule="evenodd" />
                                 </svg>
                             </div>
                             <span className="font-bold text-white tracking-widest uppercase text-sm">
                                {language === 'en' ? 'Control Deck' : 'Command Center'}
                             </span>
                         </div>
                    </div>
                    
                    {/* Scrollable Tabs */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3 pt-1">
                        {Object.keys(toolCategories).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat as ToolCategoryKey)}
                                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-full whitespace-nowrap border ${
                                    activeTab === cat 
                                    ? `${currentTheme.accent} border-transparent text-white shadow-lg shadow-${currentTheme.accent}/20` 
                                    : `border-slate-700 bg-black/20 text-slate-400`
                                }`}
                            >
                                {TAB_LABELS[cat] ? TAB_LABELS[cat][language] : cat}
                            </button>
                        ))}
                     </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 gap-3">
                         {(toolCategories[activeTab] || []).map((tool) => (
                            <button
                                key={tool.command}
                                onClick={() => handleSendMessage(tool.command)}
                                className={`group flex flex-col items-start p-4 rounded-xl border transition-all text-left relative overflow-hidden active:scale-95 ${currentTheme.border} bg-gradient-to-br from-white/5 to-transparent hover:from-white/10`}
                            >
                                {/* Active Glow Effect on Press */}
                                <div className={`absolute inset-0 opacity-0 active:opacity-20 transition-opacity ${currentTheme.accent}`} />
                                
                                <div className="flex items-center gap-2.5 w-full mb-3 z-10">
                                    <span className="text-xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{tool.icon}</span>
                                    <span className="text-xs font-bold text-white uppercase tracking-tight">{tool.label}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 leading-relaxed font-medium z-10 border-t border-white/5 pt-2 w-full">
                                    {tool.desc}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
          </div>
      )}

      {/* RIGHT PANE: SSOT Monitor */}
      <Dashboard 
        analysis={currentAnalysis} 
        mechanical={currentMechanical}
        isOpen={activeMobileTab === 'dashboard'} 
        onClose={() => handleMobileTabSwitch('chat')}
        theme={currentTheme}
        isLoading={isLoading}
        profile={learnerProfile}
        eaiState={eaiState}
        language={language}
      />

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 h-16 ${currentTheme.sidebar} border-t ${currentTheme.border} flex items-center justify-around z-[60] pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.3)]`}>
          <button 
            onClick={() => handleMobileTabSwitch('chat')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeMobileTab === 'chat' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill={activeMobileTab === 'chat' ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
             </svg>
             <span className="text-[10px] font-bold uppercase tracking-wider">Chat</span>
          </button>

          <button 
            onClick={() => handleMobileTabSwitch('tools')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeMobileTab === 'tools' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill={activeMobileTab === 'tools' ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
             </svg>
             <span className="text-[10px] font-bold uppercase tracking-wider">Tools</span>
          </button>

          <button 
            onClick={() => handleMobileTabSwitch('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeMobileTab === 'dashboard' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill={activeMobileTab === 'dashboard' ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
             </svg>
             <span className="text-[10px] font-bold uppercase tracking-wider">Monitor</span>
          </button>
      </div>
      
    </div>
  );
};

export default ChatInterface;