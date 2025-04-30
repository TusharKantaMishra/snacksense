import { NextRequest, NextResponse } from 'next/server';
interface IngredientAnalysis {
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
    riskFactors?: string[];
    benefits?: string[];
    scientificEvidence?: {
        level: 'Strong' | 'Moderate' | 'Limited' | 'Insufficient';
        studies?: string[];
    };
    sustainabilityScore?: number;
    processingLevel?: 'Minimally' | 'Moderately' | 'Highly' | 'Ultra';
    allergenRisk?: 'High' | 'Medium' | 'Low' | 'None';
    alternatives?: string[];
}
export declare function POST(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<IngredientAnalysis[]>>;
export {};
