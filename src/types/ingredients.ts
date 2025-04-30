/**
 * Types for ingredient analysis and data structures
 */

export interface IngredientAnalysis {
  ingredient: string;
  healthRating: 'Good' | 'Neutral' | 'Bad';
  explanation: string;
  details?: string[];
  nutritionalInfo?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fats?: string;
    vitamins?: string[];
    minerals?: string[];
  };
  healthScore?: number;
  dailyValuePercentage?: number;
  benefits?: string[];
  riskFactors?: string[];
  processingLevel?: string;
  alternatives?: string[];
}

export interface ExtractedIngredient {
  name: string;
  scientificName?: string;
  quantity?: string;
  type?: string;
}

export interface ProductInfo {
  name: string;
  servingSize: string;
  format: string;
  additionalInfo?: Record<string, string>;
}

export interface IngredientExtraction {
  ingredients: ExtractedIngredient[];
  productName?: string;
  servingSize?: string;
  format?: string;
  additionalInfo?: Record<string, string>;
}
