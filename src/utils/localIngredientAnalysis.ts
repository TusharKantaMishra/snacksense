/**
 * Local ingredient analysis utility to analyze ingredients without using Gemini API
 * This serves as a fallback when the Gemini API is unavailable or overloaded
 */

import { IngredientAnalysis } from '../types/ingredients';

// Common ingredient categories and their health ratings
const ingredientCategories: Record<string, {
  rating: 'Good' | 'Neutral' | 'Bad',
  explanation: string,
  riskFactors?: string[],
  benefits?: string[]
}> = {
  // Fruits and vegetables - generally good
  'fruit': {
    rating: 'Good',
    explanation: 'Fruits are generally nutritious and provide essential vitamins and antioxidants.',
    benefits: ['Rich in vitamins', 'Contains antioxidants', 'Provides dietary fiber']
  },
  'vegetable': {
    rating: 'Good',
    explanation: 'Vegetables are nutrient-dense and beneficial for overall health.',
    benefits: ['High in nutrients', 'Low in calories', 'Contains fiber and antioxidants']
  },
  
  // Whole grains - generally good
  'whole grain': {
    rating: 'Good',
    explanation: 'Whole grains contain fiber and essential nutrients.',
    benefits: ['Rich in fiber', 'Contains essential nutrients', 'Supports digestive health']
  },
  'oat': {
    rating: 'Good',
    explanation: 'Oats are rich in fiber and beneficial for heart health.',
    benefits: ['Heart healthy', 'Rich in fiber', 'Helps lower cholesterol']
  },
  
  // Proteins - mostly neutral
  'protein': {
    rating: 'Neutral',
    explanation: 'Protein is essential for the body, but the source matters for overall health impact.'
  },
  'egg': {
    rating: 'Neutral',
    explanation: 'Eggs are nutritious but contain cholesterol, which should be consumed in moderation.',
    benefits: ['High in protein', 'Contains essential nutrients'],
    riskFactors: ['Contains cholesterol']
  },
  
  // Dairy - mostly neutral
  'milk': {
    rating: 'Neutral',
    explanation: 'Milk contains calcium and protein but may not be suitable for everyone.',
    benefits: ['Source of calcium', 'Contains protein'],
    riskFactors: ['May contain lactose, which some people cannot digest']
  },
  
  // Fats and oils - varies
  'oil': {
    rating: 'Neutral',
    explanation: 'The health impact of oils depends on the source and processing method.',
    benefits: ['Some contain essential fatty acids'],
    riskFactors: ['High in calories']
  },
  
  // Sugars - generally bad
  'sugar': {
    rating: 'Bad',
    explanation: 'Added sugars provide calories with little to no nutritional value.',
    riskFactors: ['Associated with weight gain', 'May increase risk of chronic diseases', 'No nutritional benefits']
  },
  'syrup': {
    rating: 'Bad',
    explanation: 'Syrups are concentrated forms of sugar with minimal nutritional value.',
    riskFactors: ['High in calories', 'May cause blood sugar spikes']
  },
  
  // Additives - generally bad
  'additive': {
    rating: 'Bad',
    explanation: 'Many food additives may have negative health effects when consumed regularly.',
    riskFactors: ['May cause allergic reactions in some people', 'Some may have health concerns with long-term use']
  },
  'preservative': {
    rating: 'Bad',
    explanation: 'Preservatives extend shelf life but may have negative health effects.',
    riskFactors: ['May cause allergic reactions', 'Some have been linked to health concerns']
  },
  'artificial': {
    rating: 'Bad',
    explanation: 'Artificial ingredients are typically highly processed with questionable health effects.',
    riskFactors: ['May cause sensitivity in some individuals', 'Highly processed']
  },
  'color': {
    rating: 'Bad',
    explanation: 'Artificial colors add no nutritional value and may cause adverse reactions in some people.',
    riskFactors: ['No nutritional value', 'May cause hyperactivity in some children']
  },
  'flavor': {
    rating: 'Bad',
    explanation: 'Artificial flavors are typically highly processed chemical compounds.',
    riskFactors: ['No nutritional value', 'Highly processed']
  }
};

// Common harmful ingredients known to be problematic
const harmfulIngredients = new Set([
  'high fructose corn syrup',
  'partially hydrogenated',
  'monosodium glutamate',
  'sodium nitrite',
  'sodium nitrate',
  'bha',
  'bht',
  'propyl gallate',
  'potassium bromate',
  'propylene glycol',
  'butylated hydroxyanisole',
  'butylated hydroxytoluene',
  'sodium benzoate',
  'aspartame',
  'acesulfame k',
  'sucralose',
  'red 40',
  'blue 1',
  'blue 2',
  'yellow 5',
  'yellow 6'
]);

// Common beneficial ingredients known to be healthy
const beneficialIngredients = new Set([
  'omega-3',
  'flaxseed',
  'chia seed',
  'quinoa',
  'spinach',
  'broccoli',
  'kale',
  'berries',
  'turmeric',
  'ginger',
  'green tea',
  'olive oil',
  'avocado',
  'nuts',
  'seeds',
  'legumes',
  'lentils',
  'probiotics',
  'yogurt',
  'fermented'
]);

/**
 * Analyzes a single ingredient using local knowledge base
 */
function analyzeIngredient(ingredient: string): IngredientAnalysis {
  const lowerIngredient = ingredient.toLowerCase().trim();
  
  // Check if it's a known harmful ingredient
  for (const harmful of harmfulIngredients) {
    if (lowerIngredient.includes(harmful)) {
      return {
        ingredient: ingredient,
        healthRating: 'Bad',
        explanation: `Contains ${harmful}, which is generally considered unhealthy.`,
        riskFactors: ['May have negative health effects', 'Highly processed'],
        healthScore: 20
      };
    }
  }
  
  // Check if it's a known beneficial ingredient
  for (const beneficial of beneficialIngredients) {
    if (lowerIngredient.includes(beneficial)) {
      return {
        ingredient: ingredient,
        healthRating: 'Good',
        explanation: `Contains ${beneficial}, which is generally considered beneficial.`,
        benefits: ['Associated with positive health outcomes'],
        healthScore: 80
      };
    }
  }
  
  // Check against our categories
  for (const [category, info] of Object.entries(ingredientCategories)) {
    if (lowerIngredient.includes(category)) {
      return {
        ingredient: ingredient,
        healthRating: info.rating,
        explanation: info.explanation,
        benefits: info.benefits || [],
        riskFactors: info.riskFactors || [],
        healthScore: info.rating === 'Good' ? 70 : (info.rating === 'Neutral' ? 50 : 30)
      };
    }
  }
  
  // Default analysis for unknown ingredients
  return {
    ingredient: ingredient,
    healthRating: 'Neutral',
    explanation: 'Not enough information available for this ingredient.',
    healthScore: 50
  };
}

/**
 * Analyzes ingredients locally without using Gemini API
 */
export function analyzeIngredientsLocally(ingredientList: string[]): IngredientAnalysis[] {
  if (!ingredientList || !Array.isArray(ingredientList) || ingredientList.length === 0) {
    return [];
  }
  
  return ingredientList.map(ingredient => analyzeIngredient(ingredient));
}

/**
 * Extracts ingredients from raw OCR text
 */
export function extractIngredientsFromText(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  // Look for ingredients section
  const ingredientSectionRegex = /ingredients:([^.]*)|contains:([^.]*)|ingredients\s+list:([^.]*)/i;
  const match = text.match(ingredientSectionRegex);
  
  let ingredientText = '';
  if (match && (match[1] || match[2] || match[3])) {
    ingredientText = (match[1] || match[2] || match[3]).trim();
  } else {
    // If no clear section, use the entire text
    ingredientText = text;
  }
  
  // Split by commas and common separators
  const ingredients = ingredientText
    .split(/[,;()]/)
    .map(item => item.trim())
    .filter(item => item.length > 2 && !/^\d+$/.test(item)); // Remove numbers and very short items
  
  return ingredients;
}
