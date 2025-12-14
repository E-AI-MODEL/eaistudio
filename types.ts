
export interface LearnerProfile {
  name: string | null;
  subject: string | null; // Vak
  level: string | null;   // Niveau (VWO, HAVO, etc.)
  grade: string | null;   // Leerjaar
}

export type CognitiveMode = 'ANALYTISCH' | 'REFLECTIEF' | 'SYSTEMISCH' | 'PRAGMATISCH' | 'CREATIEF' | 'NORMATIEF' | 'ONBEKEND';

export interface EAIAnalysis {
  process_phases: string[]; 
  coregulation_bands: string[]; 
  task_densities: string[]; 
  secondary_dimensions: string[]; // NEW: For V, T, E, L rubrics
  active_fix: string | null; 
  reasoning: string;
  current_profile: LearnerProfile;
  task_density_balance: number; // 0 (Full AI) to 100 (Full Learner)
  epistemic_status: 'FEIT' | 'INTERPRETATIE' | 'SPECULATIE' | 'ONBEKEND';
  cognitive_mode: CognitiveMode;
}

export interface MechanicalState {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
  temperature: number;
  timestamp: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
  analysis?: EAIAnalysis;
  mechanical?: MechanicalState;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  showDashboard: boolean;
  currentAnalysis: EAIAnalysis | null;
  currentMechanical: MechanicalState | null;
}
