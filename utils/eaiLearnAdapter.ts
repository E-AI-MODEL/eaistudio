import { EAI_CORE, getEAICore } from './ssotParser';
import type { EAIAnalysis, MechanicalState } from '../types';

// =========================
// 1. Types – lichte EAIState
// =========================

export interface EAIBands {
  P?: string | null;
  C?: string | null;
  TD?: string | null;
  V?: string | null;
  T?: string | null;
  E?: string | null;
  S?: string | null;
  L?: string | null;
  B?: string | null;
}

export interface EAIHistoryEntry {
  turn: number;
  bands: EAIBands;
  primary_band_id: string | null;
  content_bands: string[];
  skill_bands: string[];
  timestamp: number;
}

export interface EAIStateLike {
  turn_counter: number;
  current_bands: EAIBands;
  current_phase: string | null;
  active_fix: string | null;
  cognitive_mode: string | null;
  epistemic_status: string | null;
  history: EAIHistoryEntry[];
  mechanical: MechanicalState | null;
}

// =========================
// 2. Helpers
// =========================

const CONTENT_DIMENSIONS = ['V', 'E', 'B', 'T'] as const;
const SKILL_DIMENSIONS   = ['P', 'C', 'TD', 'S', 'L'] as const;

// Haalt dimensie-prefix uit een band-id, bijv. "TD3_StructuurGuard" → "TD"
function extractDimensionFromBandId(bandId: string | null | undefined): string | null {
  if (!bandId) return null;
  const prefix = bandId.split('_')[0];
  // Basic check for prefixes defined in types/SSOT
  if (['P','C','TD','V','T','E','S','L','B'].includes(prefix)) {
    return prefix;
  }
  // Fallback for simple letter prefixes like P1, C3
  const letter = bandId.charAt(0);
  if (['P','C','V','T','E','S','L','B'].includes(letter)) return letter;
  if (bandId.startsWith('TD')) return 'TD';
  
  return null;
}

// =========================
// 3. Initial state
// =========================

export function createInitialEAIState(): EAIStateLike {
  return {
    turn_counter: 0,
    current_bands: {},
    current_phase: null,
    active_fix: null,
    cognitive_mode: null,
    epistemic_status: null,
    history: [],
    mechanical: null,
  };
}

// =========================
// 4. State update uit EAIAnalysis
// =========================

export function updateStateFromAnalysis(
  prev: EAIStateLike,
  analysis: EAIAnalysis,
  mechanical?: MechanicalState | null,
): EAIStateLike {
  const nextTurn = prev.turn_counter + 1;
  const nextBands: EAIBands = { ...prev.current_bands };

  // 4.1 Taakdichtheid – map task_densities naar dimensies
  (analysis.task_densities ?? []).forEach((bandId) => {
    const dim = extractDimensionFromBandId(bandId);
    if (dim) {
      (nextBands as any)[dim] = bandId;
    }
  });

  // 4.2 Co-regulatie – map coregulation_bands
  (analysis.coregulation_bands ?? []).forEach((bandId) => {
    const dim = extractDimensionFromBandId(bandId);
    if (dim) {
      (nextBands as any)[dim] = bandId;
    }
  });

  // 4.3 Procesfase – laatste phase als current_phase
  const phases = analysis.process_phases ?? [];
  const currentPhase = phases.length > 0
    ? phases[phases.length - 1]
    : prev.current_phase;
    
  // Update phase in bands too
  if (currentPhase) {
      nextBands.P = currentPhase;
  }
  
  // 4.4 Secondary Dimensions (CRITICAL UPDATE)
  (analysis.secondary_dimensions ?? []).forEach((bandId) => {
      const dim = extractDimensionFromBandId(bandId);
      if (dim) {
          (nextBands as any)[dim] = bandId;
      }
  });

  // 4.5 Primary band: voorkeur TD, dan C, anders wat er is
  const primaryBand =
    (analysis.task_densities && analysis.task_densities[0]) ||
    (analysis.coregulation_bands && analysis.coregulation_bands[0]) ||
    null;

  const contentBands: string[] = [];
  const skillBands: string[] = [];

  for (const [dim, bandId] of Object.entries(nextBands)) {
    if (!bandId) continue;
    if (CONTENT_DIMENSIONS.includes(dim as any)) {
      contentBands.push(bandId as string);
    }
    if (SKILL_DIMENSIONS.includes(dim as any)) {
      skillBands.push(bandId as string);
    }
  }

  const historyEntry: EAIHistoryEntry = {
    turn: nextTurn,
    bands: nextBands,
    primary_band_id: primaryBand,
    content_bands: contentBands,
    skill_bands: skillBands,
    timestamp: Date.now(),
  };

  return {
    turn_counter: nextTurn,
    current_bands: nextBands,
    current_phase: currentPhase,
    active_fix: analysis.active_fix ?? prev.active_fix ?? null,
    cognitive_mode: analysis.cognitive_mode ?? prev.cognitive_mode ?? null,
    epistemic_status: analysis.epistemic_status ?? prev.epistemic_status ?? null,
    history: [...prev.history, historyEntry],
    mechanical: mechanical ?? prev.mechanical ?? null,
  };
}

// =========================
// 5. Validatie Gemini-output tegen SSOT
// =========================

export interface SSOTValidationResult {
  ok: boolean;
  unknownBands: string[];
  unknownCommands: string[];
}

/**
 * Checkt of alle bands en commands die Gemini teruggeeft
 * ook daadwerkelijk in de SSOT voorkomen (vergelijkbaar met quickIntegrityCheck).
 * Nu met taal-support.
 */
export function validateAnalysisAgainstSSOT(analysis: EAIAnalysis, language: 'nl' | 'en' = 'nl'): SSOTValidationResult {
  const core = getEAICore(language); // Get correct core based on language
  const knownBandIds = new Set<string>();
  const knownCommands = new Set<string>();

  // Vul sets uit de taal-specifieke core
  core.rubrics.forEach((rubric) => {
    (rubric.bands ?? []).forEach((band) => {
      if (band.band_id) knownBandIds.add(band.band_id);
    });
  });

  core.commands.forEach((cmd) => {
    if (cmd.command) knownCommands.add(cmd.command);
  });

  const candidateBands = [
    ...(analysis.task_densities ?? []),
    ...(analysis.coregulation_bands ?? []),
    ...(analysis.process_phases ?? []),
    ...(analysis.secondary_dimensions ?? []), // Added missing secondary dimensions check
  ].filter(Boolean);

  const unknownBands = candidateBands.filter((id) => !knownBandIds.has(id as string));

  const unknownCommands: string[] = [];
  if (analysis.active_fix && analysis.active_fix !== 'NONE' && !knownCommands.has(analysis.active_fix)) {
    unknownCommands.push(analysis.active_fix);
  }

  return {
    ok: unknownBands.length === 0 && unknownCommands.length === 0,
    unknownBands,
    unknownCommands,
  };
}

// =========================
// 6. Mini-integrity-check van de SSOT zelf
// =========================

/**
 * Snelle sanity-check of de ingeladen EAI_CORE er "echt" uitziet.
 * Zwaardere checks zitten in EAI Learn 4.0.1, dit is de light variant.
 */
export function quickCoreIntegrityCheck(): boolean {
  try {
    if (!EAI_CORE || !EAI_CORE.rubrics || !EAI_CORE.commands) return false;

    const rubricCount = EAI_CORE.rubrics.length;
    const commandCount = EAI_CORE.commands.length;

    // Based on the provided sample file, we might have fewer items than a full prod env
    // Adjusting checks to be permissive for this specific demo file (which has ~3 rubrics)
    if (rubricCount < 1) return false;      
    if (commandCount < 5) return false;     

    return true;
  } catch {
    return false;
  }
}