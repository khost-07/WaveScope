/**
 * LAYER 3: LLM EXPLANATION TYPES
 * Structured schema for LLM-generated explanations.
 * Strictly separates confirmed facts from hypotheses, and provides concrete recommendations.
 * Includes a dedicated super-simple plain English overview for non-technical users.
 */

export interface ActionableRecommendation {
  action: string;
  impact: string;
  targetLayer: 'RF_PHYSICAL' | 'CLIENT_CONFIG' | 'AP_CONFIG' | 'HARDWARE_UPGRADE';
}

export interface SimpleOverview {
  headline: string;
  whatIsHappening: string;
  whyItMatters: string;
  simpleStepsToFix: string[];
  experienceRating: string;
}

export interface LLMExplanationResponse {
  summary: string;
  plainEnglishExplanation: string;
  simpleOverview?: SimpleOverview;
  confirmedFacts: string[];
  possibleHypotheses: string[];
  recommendations: ActionableRecommendation[];
  generatedAt: number;
  isCachedFallback: boolean;
  sourceModel: string;
}
