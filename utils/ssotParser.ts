
import { EAI_SSOT_JSON_NL, EAI_SSOT_JSON_EN } from '../constants';

// Define types for the parsed SSOT structure
export interface SSOTCommand {
  command: string;
  description: string;
}

export interface SSOTBand {
  band_id: string;
  label: string;
  description: string;
  fix?: string;
  // Extended intellectual content
  learner_obs?: string[];
  ai_obs?: string[];
  didactic_principle?: string;
}

export interface SSOTRubric {
  rubric_id: string;
  name: string;
  bands: SSOTBand[];
}

export interface SSOTStructure {
  commands: SSOTCommand[];
  rubrics: SSOTRubric[];
  cycleOrder: string[];
  metadata: {
    version: string;
    system: string;
  };
}

// Internal cache
let cachedCoreNL: SSOTStructure | null = null;
let cachedCoreEN: SSOTStructure | null = null;

// The Parser Logic
const parseJSON = (jsonString: string): SSOTStructure => {
  try {
    const raw = JSON.parse(jsonString);
    
    // Extract Commands
    const commandsObj = raw.command_library?.commands || {};
    const commands: SSOTCommand[] = Object.entries(commandsObj).map(([cmd, desc]) => ({
      command: cmd,
      description: desc as string
    }));

    // Extract Rubrics
    const rubrics: SSOTRubric[] = (raw.rubrics || []).map((r: any) => ({
      rubric_id: r.rubric_id,
      name: r.name,
      bands: (r.bands || []).map((b: any) => ({
        band_id: b.band_id,
        label: b.label,
        description: b.description,
        fix: b.fix,
        // Extract deep pedagogical data
        learner_obs: b.learner_obs,
        ai_obs: b.ai_obs,
        didactic_principle: b.didactic_principle
      }))
    }));

    // Extract Cycle
    const cycleOrder = raw.metadata?.cycle?.order || [];

    return {
      commands,
      rubrics,
      cycleOrder,
      metadata: {
        version: raw.version,
        system: raw.metadata?.system
      }
    };
  } catch (e) {
    console.error("CRITICAL: Failed to parse SSOT JSON", e);
    return {
      commands: [],
      rubrics: [],
      cycleOrder: [],
      metadata: { version: '0.0.0', system: 'Error' }
    };
  }
};

// Dynamic Getter
export const getEAICore = (lang: 'nl' | 'en' = 'nl'): SSOTStructure => {
    if (lang === 'en') {
        if (!cachedCoreEN) cachedCoreEN = parseJSON(EAI_SSOT_JSON_EN);
        return cachedCoreEN;
    } else {
        if (!cachedCoreNL) cachedCoreNL = parseJSON(EAI_SSOT_JSON_NL);
        return cachedCoreNL;
    }
};

// Legacy fallback for components that expect a static export (defaults to NL)
export const EAI_CORE = getEAICore('nl'); 
