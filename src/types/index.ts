/**
 * Simmory Core Domain Types
 * Phase 1 Architecture Foundation
 */

export type CueType = 'visual' | 'sensory' | 'technique' | 'auditory';

export interface CookingCue {
  id: string;
  timestampSeconds: number;
  cueType: CueType;
  cuePhrase: string; // e.g. "Until the oil rises", "When the edges blister"
  sensoryDescription: string;
  isConfirmedByCook: boolean;
}

export interface IngredientItem {
  id: string;
  name: string;
  approximateAmount?: string;
  unit?: string;
  isConfirmed: boolean;
  notes?: string; // e.g. "Traditional coarse sea salt"
}

export interface CookingStep {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  timestampStart: number; // in seconds
  timestampEnd: number; // in seconds
  cues: CookingCue[];
  ingredientsUsed: IngredientItem[];
  isVerifiedByCook: boolean;
  cookNotes?: string;
}

export interface CookProfile {
  id: string;
  name: string;
  relationship?: string; // e.g. "Grandmother", "Uncle Carlos", "Mom"
  avatarUrl?: string;
  bio?: string;
}

export type RecipeStatus = 'draft' | 'review_pending' | 'verified_by_cook' | 'archived';

export interface Recipe {
  id: string;
  title: string;
  originalDishName?: string;
  description: string;
  kitchenId: string;
  kitchenName?: string;
  cook: CookProfile;
  videoDurationSeconds: number;
  videoFilename?: string;
  status: RecipeStatus;
  servings?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  culturalHeritage?: string;
  familyStory?: string;
  stepsCount: number;
  cuesCount: number;
  steps?: CookingStep[];
  ingredients?: IngredientItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Kitchen {
  id: string;
  name: string;
  description: string;
  familyHeritage?: string;
  recipeCount: number;
  memberCount: number;
  creatorName: string;
  createdAt: string;
}

export type PipelineStage = 
  | 'upload'
  | 'audio_transcription' // Faster-Whisper
  | 'frame_analysis'      // Gemma 4 vision
  | 'timeline_proposal'   // Action alignment
  | 'human_review'        // Cook verifies & fills details
  | 'published';

export interface ProcessingPipelineStatus {
  recipeId: string;
  currentStage: PipelineStage;
  progressPercent: number;
  isAwaitingHumanReview: boolean;
  statusMessage: string;
  errorMessage?: string;
}
