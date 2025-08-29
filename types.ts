export enum HealthLevel {
  Healthy = 'Saludable',
  Moderate = 'Moderado',
  Unhealthy = 'Poco Saludable',
}

export interface Nutrient {
  name: string;
  amount: string;
}

export interface Ingredient {
  name: string;
  calories: number;
  nutrients: Nutrient[];
  vitamins: Nutrient[];
  minerals: Nutrient[];
  fattyAcids: Nutrient[];
}

export interface HealthyAlternative {
  name: string;
  description: string;
}

export interface AnalysisResult {
  needsClarification?: boolean;
  clarificationQuestion?: string;
  totalCalories?: number;
  healthLevel?: HealthLevel;
  ingredients?: Ingredient[];
  recommendation?: string;
  healthyAlternatives?: HealthyAlternative[];
}

// Types for Meal Planner
export interface UserProfile {
  goal: 'mantener peso' | 'perder peso' | 'ganar musculo' | 'salud general' | 'ayuno intermitente';
  gender: 'masculino' | 'femenino' | 'otro';
  age: number;
  weight?: string;
  height?: string;
  restrictions: string;
  dislikes: string;
  planDuration: 'un dia' | 'una semana' | 'un mes';
  fastingType?: '16:8' | '18:6' | '20:4';
}

export interface Meal {
  type: 'Desayuno' | 'Almuerzo' | 'Cena' | 'Snack' | 'Romper Ayuno' | 'Comida';
  name: string;
  description: string;
  calories?: number;
  nutrients?: Nutrient[];
  vitamins?: Nutrient[];
  minerals?: Nutrient[];
}

export interface DayPlan {
  day: string;
  meals: Meal[];
}

export interface MealPlan {
  title: string;
  summary: string;
  plan: DayPlan[];
  fastingProtocol?: string;
  fastingRecommendations?: string;
  supplements?: string[];
}