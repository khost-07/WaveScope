/**
 * LAYER 3: LLM EXPLANATION SERVICE
 * Strictly live API execution (Zero Fallback).
 * Configured with Gemini 3.1 Flash Lite model.
 * 
 * INVARIANTS:
 * 1. Only triggers on explicit device selection.
 * 2. Receives BOTH device telemetry and pre-computed diagnosis (never raw telemetry alone).
 * 3. Never performs networking scoring calculations.
 * 4. ALWAYS calls the Gemini API directly with the user's API Key.
 */

import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { LLMExplanationResponse, SimpleOverview } from './types';
import { buildLLMPrompt } from './promptBuilder';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';

export interface LLMRequestState {
  isLoading: boolean;
  error: string | null;
  explanation: LLMExplanationResponse | null;
  latencyMs: number;
}

/**
 * Calls the Google Gemini API (model: gemini-3.1-flash-lite) to generate
 * a natural language explanation and super-simple overview for a selected device.
 */
export async function generateExplanation(
  device: ClientDevice,
  diagnosis: StructuredDiagnosis,
  apiKey: string,
  model: string = DEFAULT_GEMINI_MODEL
): Promise<LLMExplanationResponse> {
  const cleanKey = apiKey ? apiKey.trim() : '';
  const cleanModel = model ? model.trim() : DEFAULT_GEMINI_MODEL;

  if (!cleanKey) {
    throw new Error('Gemini API Key is required. Please configure your API key to generate live diagnostic explanations.');
  }

  const { systemPrompt, userContent } = buildLLMPrompt(device, diagnosis);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cleanModel)}:generateContent?key=${encodeURIComponent(cleanKey)}`;
  
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemPrompt}\n\nDevice Data & Pre-computed Diagnosis Input:\n${userContent}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} (${response.statusText})`;
    try {
      const errJson = await response.json();
      if (errJson.error?.message) {
        errorDetail = `${errJson.error.message} [Code: ${errJson.error.code || response.status}]`;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(`Gemini API Request Failed (${cleanModel}): ${errorDetail}`);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini API returned an empty response. Check if model output was filtered.');
  }

  // Clean any markdown wrapper if present
  let cleanJson = rawText.trim();
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.slice(7);
  } else if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.slice(3);
  }
  if (cleanJson.endsWith('```')) {
    cleanJson = cleanJson.slice(0, -3);
  }
  cleanJson = cleanJson.trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (parseErr: any) {
    throw new Error(`Failed to parse LLM JSON response: ${parseErr.message}\nRaw Text: ${rawText}`);
  }

  const simpleOverview: SimpleOverview = {
    headline: parsed.simpleOverview?.headline || diagnosis.primary_diagnosis,
    whatIsHappening: parsed.simpleOverview?.whatIsHappening || parsed.summary || "Analyzing network conditions...",
    whyItMatters: parsed.simpleOverview?.whyItMatters || "Connection performance may be impacted.",
    simpleStepsToFix: Array.isArray(parsed.simpleOverview?.simpleStepsToFix) && parsed.simpleOverview.simpleStepsToFix.length > 0
      ? parsed.simpleOverview.simpleStepsToFix
      : (Array.isArray(parsed.recommendations) ? parsed.recommendations.map((r: any) => r.action) : ["Check Wi-Fi connection"]),
    experienceRating: parsed.simpleOverview?.experienceRating || (diagnosis.status === 'HEALTHY' ? 'Optimal Performance' : 'Performance Degraded')
  };

  return {
    summary: parsed.summary || "Diagnostic analysis generated.",
    plainEnglishExplanation: parsed.plainEnglishExplanation || "",
    simpleOverview,
    confirmedFacts: Array.isArray(parsed.confirmedFacts) ? parsed.confirmedFacts : diagnosis.evidence,
    possibleHypotheses: Array.isArray(parsed.possibleHypotheses) ? parsed.possibleHypotheses : diagnosis.possible_causes,
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    generatedAt: Date.now(),
    isCachedFallback: false,
    sourceModel: `${cleanModel} (Live API)`
  };
}
