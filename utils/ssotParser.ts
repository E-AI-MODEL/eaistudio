import { EAI_SSOT_JSON } from '../constants';

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

// The Kernel Logic: Parsing the raw JSON string into a usable engine
export const parseSSOT = (): SSOTStructure => {
  try {
    const raw = JSON.parse(EAI_SSOT_JSON);
    
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

// Singleton instance of the parsed core
export const EAI_CORE = parseSSOT();