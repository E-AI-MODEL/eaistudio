
import { GoogleGenAI, Chat, Type, Schema } from "@google/genai";
import { SYSTEM_INSTRUCTION_NL, SYSTEM_INSTRUCTION_EN } from "../constants";
import { EAIAnalysis, MechanicalState, LearnerProfile, CognitiveMode } from "../types";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;
let currentLanguage: 'nl' | 'en' = 'nl';

const MODEL_NAME = 'gemini-3-pro-preview';
const TEMPERATURE = 0.7;

export const initializeGemini = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing in environment variables.");
    return;
  }
  genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Reset session explicitly (e.g. when changing language)
export const resetChatSession = () => {
    chatSession = null;
};

// Define the schema for the structured response
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    conversational_response: {
      type: Type.STRING,
      description: "The direct response to the user acting as the Learning Coach.",
    },
    analysis: {
      type: Type.OBJECT,
      description: "The EAI architectural analysis of the current turn.",
      properties: {
        process_phases: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "The detected Process Phases (P0-P5). There can be multiple active phases.",
        },
        coregulation_bands: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "The Co-regulation Bands (C0-C5) detected. There can be multiple.",
        },
        task_densities: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "The Task Density Bands (TD0-TD5). There can be multiple.",
        },
        secondary_dimensions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Any other detected bands from the SSOT (V0-V5, T0-T4, E0-E4, L0-L4).",
        },
        active_fix: {
          type: Type.STRING,
          description: "The command ID (e.g., '/beurtvraag', '/checkin') of the fix applied, or 'NONE' if no specific fix is needed.",
          nullable: true,
        },
        reasoning: {
          type: Type.STRING,
          description: "Brief internal logic explaining why this specific band and fix were chosen based on the SSOT.",
        },
        current_profile: {
          type: Type.OBJECT,
          description: "The accumulated learner profile context detected so far.",
          properties: {
            name: { type: Type.STRING, nullable: true },
            subject: { type: Type.STRING, nullable: true, description: "Het vak waar het over gaat" },
            level: { type: Type.STRING, nullable: true, description: "Opleidingsniveau (bijv. HAVO, VWO, HBO)" },
            grade: { type: Type.STRING, nullable: true, description: "Leerjaar (bijv. 4, groep 8)" },
          }
        },
        task_density_balance: {
            type: Type.NUMBER,
            description: "A score from 0 (AI generates everything) to 100 (Learner generates everything) based on the current interaction."
        },
        epistemic_status: {
            type: Type.STRING,
            enum: ['FEIT', 'INTERPRETATIE', 'SPECULATIE', 'ONBEKEND'],
            description: "The nature of the knowledge currently being discussed."
        },
        cognitive_mode: {
            type: Type.STRING,
            enum: ['ANALYTISCH', 'REFLECTIEF', 'SYSTEMISCH', 'PRAGMATISCH', 'CREATIEF', 'NORMATIEF', 'ONBEKEND'],
            description: "The dominant thinking style (Cognitive Mode) of the response based on the 'Taal die werkt' framework."
        }
      },
      required: ["process_phases", "coregulation_bands", "task_densities", "secondary_dimensions", "reasoning", "current_profile", "task_density_balance", "epistemic_status", "cognitive_mode"],
    },
  },
  required: ["conversational_response", "analysis"],
};

export const getChatSession = (lang: 'nl' | 'en' = 'nl'): Chat => {
  if (!genAI) {
    initializeGemini();
  }
  
  if (!genAI) {
    throw new Error("Failed to initialize GoogleGenAI. Check API Key.");
  }

  // If language changed, force reset
  if (currentLanguage !== lang) {
      chatSession = null;
      currentLanguage = lang;
  }

  if (!chatSession) {
    const systemInstruction = lang === 'en' ? SYSTEM_INSTRUCTION_EN : SYSTEM_INSTRUCTION_NL;
    
    chatSession = genAI.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: {
            thinkingBudget: 8192, 
        },
        temperature: TEMPERATURE,
      },
    });
  }
  return chatSession;
};

export const sendMessageToGemini = async (message: string, lang: 'nl' | 'en' = 'nl'): Promise<{ text: string; analysis: EAIAnalysis; mechanical: MechanicalState }> => {
  try {
    const chat = getChatSession(lang);
    
    const startTime = Date.now();
    const result = await chat.sendMessage({ message });
    const endTime = Date.now();
    const latency = endTime - startTime;

    const responseText = result.text;
    if (!responseText) {
       throw new Error("Empty response from Gemini");
    }

    // Try to get token usage
    const usage = result.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };

    // Mechanical State
    const mechanical: MechanicalState = {
        latencyMs: latency,
        inputTokens: usage.promptTokenCount || 0,
        outputTokens: usage.candidatesTokenCount || 0,
        model: MODEL_NAME,
        temperature: TEMPERATURE,
        timestamp: new Date()
    };

    // Parse the JSON response
    try {
      const parsed = JSON.parse(responseText);
      
      const profile: LearnerProfile = {
        name: parsed.analysis.current_profile?.name || null,
        subject: parsed.analysis.current_profile?.subject || null,
        level: parsed.analysis.current_profile?.level || null,
        grade: parsed.analysis.current_profile?.grade || null,
      };

      const analysisData: EAIAnalysis = {
        process_phases: parsed.analysis.process_phases || [],
        coregulation_bands: parsed.analysis.coregulation_bands || [],
        task_densities: parsed.analysis.task_densities || [],
        secondary_dimensions: parsed.analysis.secondary_dimensions || [], // Captured here
        active_fix: parsed.analysis.active_fix === 'NONE' ? null : parsed.analysis.active_fix,
        reasoning: parsed.analysis.reasoning || "No reasoning provided.",
        current_profile: profile,
        // Set default to 50 (Neutral) to avoid bias if undefined
        task_density_balance: parsed.analysis.task_density_balance ?? 50,
        epistemic_status: parsed.analysis.epistemic_status || 'ONBEKEND',
        cognitive_mode: parsed.analysis.cognitive_mode || 'ONBEKEND',
      };

      return {
        text: parsed.conversational_response,
        analysis: analysisData,
        mechanical: mechanical
      };
    } catch (e) {
      console.error("Failed to parse JSON response:", responseText);
      return {
        text: responseText, 
        analysis: {
            process_phases: ["Error"],
            coregulation_bands: ["Error"],
            task_densities: ["Error"],
            secondary_dimensions: [],
            active_fix: null,
            reasoning: "Raw parsing error.",
            current_profile: { name: null, subject: null, level: null, grade: null },
            task_density_balance: 50, // Default to 50 on error
            epistemic_status: 'ONBEKEND',
            cognitive_mode: 'ONBEKEND',
        },
        mechanical: mechanical
      };
    }

  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    throw error;
  }
};
