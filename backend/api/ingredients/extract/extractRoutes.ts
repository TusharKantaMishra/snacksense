import express, { Request, Response } from 'express';

const router = express.Router();

interface IngredientData {
  name: string;
  scientificName?: string;
  quantity?: string;
  percentage?: string;
  type?: string; // e.g., "active ingredient", "excipient", etc.
}

// POST /api/ingredients/extract
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, any>; 
    const text = body?.text;

    if (!text) {
      return (res as any).status(400).json({ error: 'No text provided' });
    }
    
    // Extract composition and ingredients information
    const result = extractIngredientsData(text);
    
    // Ensure we always return at least some ingredients
    if (!result.ingredients || result.ingredients.length === 0) {
      // Fallback to a very basic extraction as last resort
      const fallbackIngredients: IngredientData[] = text
        .split(/[,.\n;]/)
        .map((part: string) => part.trim())
        .filter((part: string) => part.length > 3)
        .map((part: string) => ({ name: part }));
      
      if (fallbackIngredients.length > 0) {
        result.ingredients = fallbackIngredients;
        result.format = 'fallback';
      }
    }
    
    return (res as any).json(result);
  } catch (error) {
    console.error('Ingredients extraction error:', error);
    return (res as any).status(500).json({
      error: error instanceof Error ? error.message : 'Failed to extract ingredients'
    });
  }
});

function extractIngredientsData(text: string) {
  // Detect the type of ingredient listing format
  const format = detectFormat(text);
  
  let ingredients: IngredientData[] = [];
  let servingSize: string | null = null;
  let productName: string | null = null;
  const additionalInfo: Record<string, string> = {};
  
  // Extract product name if present
  const productNameMatch = text.match(/^([^:]+?)(?::|$)/m);
  if (productNameMatch) {
    productName = productNameMatch[1].trim();
  }
  
  // Extract serving size if present
  const servingSizeMatch = text.match(/each\s+\(([^)]+)\)|serving size:?\s*([^,\n]+)/i);
  if (servingSizeMatch) {
    servingSize = (servingSizeMatch[1] || servingSizeMatch[2]).trim();
  }
  
  // Check for "No preservatives" and similar statements
  const noPreservativesMatch = text.match(/no preservatives|no artificial|no colou?ring/gi);
  if (noPreservativesMatch) {
    additionalInfo.preservativeFree = noPreservativesMatch.join(', ');
  }
  
  // Extract ingredients based on the detected format
  switch (format) {
    case 'composition':
      ingredients = parseCompositionFormat(text);
      break;
    case 'ingredients-list':
      ingredients = parseIngredientsListFormat(text);
      break;
    case 'nutrition-facts':
      ingredients = parseNutritionFactsFormat(text);
      break;
    default:
      // Fallback to basic ingredient extraction
      ingredients = parseBasicIngredients(text);
  }
  
  return {
    productName,
    servingSize,
    ingredients,
    additionalInfo,
    format
  };
}

function detectFormat(text: string): string {
  // Check for composition format (like in the Hajmola candy image)
  if (text.match(/composition:|each .+ (candy|tablet|capsule) is prepared from:/i)) {
    return 'composition';
  }
  
  // Check for standard ingredients list
  if (text.match(/ingredients:|contains:/i)) {
    return 'ingredients-list';
  }
  
  // Check for nutrition facts
  if (text.match(/nutrition facts|nutritional information/i)) {
    return 'nutrition-facts';
  }
  
  return 'unknown';
}

function parseCompositionFormat(text: string): IngredientData[] {
  const ingredients: IngredientData[] = [];
  
  // Extract the composition section
  const compositionMatch = text.match(/composition:.*?(?=\n\n|\n[A-Z]|$)/is);
  if (!compositionMatch) return ingredients;
  
  const compositionText = compositionMatch[0];
  
  // Handle "Powders of:" format specifically (like in Hajmola candy)
  const powdersMatch = text.match(/powders\s+of:([^.]+)/i);
  if (powdersMatch) {
    const powdersText = powdersMatch[1];
    const powderParts = powdersText.split(',').map(p => p.trim()).filter(p => p.length > 0);
    
    for (const part of powderParts) {
      // Check for quantity information
      const quantityMatch = part.match(/(.+?)\s*(\d+(?:\.\d+)?\s*(?:mg|g|mcg|%|))?$/);
      
      if (quantityMatch) {
        const name = quantityMatch[1].trim();
        const quantity = quantityMatch[2]?.trim();
        
        ingredients.push({
          name,
          quantity,
          type: 'powder'
        });
      } else {
        ingredients.push({
          name: part,
          type: 'powder'
        });
      }
    }
  }
  
  // Extract quantities with names (e.g., "Black Salt 120 mg")
  const quantityMatches = compositionText.matchAll(/([^\d,]+?)\s*(\d+(?:\.\d+)?\s*(?:mg|g|mcg|%|))(?:,|$)/g);
  
  for (const match of Array.from(quantityMatches)) {
    const name = match[1].trim();
    const quantity = match[2].trim();
    
    // Skip duplicates
    if (!ingredients.some(ing => ing.name.toLowerCase() === name.toLowerCase())) {
      ingredients.push({
        name,
        quantity
      });
    }
  }
  
  // Handle "Active ingredients" section specifically
  const activeMatch = text.match(/active ingredients:([^.]+)/i);
  if (activeMatch) {
    const activeText = activeMatch[1];
    const activeParts = activeText.split(',').map(p => p.trim()).filter(p => p.length > 0);
    
    for (const part of activeParts) {
      // Add only if not already added
      if (!ingredients.some(ing => ing.name.toLowerCase() === part.toLowerCase())) {
        ingredients.push({
          name: part,
          type: 'active ingredient'
        });
      }
    }
  }
  
  // Handle "Excipients" section specifically
  const excipientsMatch = text.match(/excipients:([^.]+)/i);
  if (excipientsMatch) {
    ingredients.push({
      name: 'Excipients',
      quantity: excipientsMatch[1].trim(),
      type: 'excipient'
    });
  }
  
  return ingredients;
}

function parseIngredientsListFormat(text: string): IngredientData[] {
  const ingredients: IngredientData[] = [];
  
  // Extract the ingredients section
  const ingredientsMatch = text.match(/ingredients:(.+?)(?:\.|nutrition facts|nutritional information|storage|directions|allergen|warnings)/is);
  if (!ingredientsMatch) return ingredients;
  
  const ingredientsText = ingredientsMatch[1].trim();
  
  // Split by common delimiters
  const parts = ingredientsText.split(/,|\(|\)|\n/).filter(part => part.trim().length > 0);
  
  for (let part of parts) {
    part = part.trim();
    if (!part || part.toLowerCase().includes('may contain')) continue;
    
    // Remove common words that aren't ingredients
    part = part.replace(/^and\s+|^contains\s+|^including\s+/i, '').trim();
    
    if (part) {
      // Check for percentage
      const percentageMatch = part.match(/(.+?)\s*\(([0-9.]+%)\)/);
      
      if (percentageMatch) {
        ingredients.push({
          name: percentageMatch[1].trim(),
          percentage: percentageMatch[2]
        });
      } else {
        ingredients.push({ name: part });
      }
    }
  }
  
  return ingredients;
}

function parseNutritionFactsFormat(text: string): IngredientData[] {
  // This would handle nutrition facts tables
  // For now, return empty array as this requires more complex parsing
  // We're acknowledging the text parameter to avoid lint errors
  console.log(`Nutrition facts parsing not yet implemented for: ${text.substring(0, 50)}...`);
  return [];
}

function parseBasicIngredients(text: string): IngredientData[] {
  const ingredients: IngredientData[] = [];
  
  // First try to find an ingredients section
  const ingredientsSection = text.match(/ingredients:?\s*([\s\S]+?)(?:\.|$)/i);
  const textToProcess = ingredientsSection ? ingredientsSection[1] : text;
  
  // Split by common delimiters
  const parts = textToProcess
    .split(/,|\(|\)|\n|;|•|\./) 
    .map(part => part.trim())
    .filter(part => part.length > 0);
  
  // Filter out common non-ingredient phrases
  for (let part of parts) {
    part = part.trim();
    
    // Skip common non-ingredient phrases
    if (!part || 
        part.toLowerCase().includes('may contain') ||
        part.toLowerCase().includes('manufactured in') ||
        part.toLowerCase().includes('produced by') ||
        part.match(/^\d+%$/) || // Skip percentage-only entries
        part.match(/^[a-z\s]+:$/i) // Skip section headers
    ) {
      continue;
    }
    
    // Remove common words that aren't ingredients
    part = part.replace(/^and\s+|^contains\s+|^including\s+|^ingredients\s+|^with\s+/i, '').trim();
    
    // Extract quantity if present
    let quantity: string | undefined;
    const quantityMatch = part.match(/(\d+(?:\.\d+)?(?:\s*[a-z]+)?)\s+(.+)/i);
    
    if (quantityMatch) {
      quantity = quantityMatch[1];
      part = quantityMatch[2];
    }
    
    if (part && part.length > 1) { // Ensure we have a meaningful ingredient name (more than 1 character)
      ingredients.push({ 
        name: part,
        quantity: quantity
      });
    }
  }
  
  // If we still have no ingredients, try a more aggressive approach
  if (ingredients.length === 0) {
    // Look for words that are likely ingredients (more than 3 characters, not common stop words)
    const stopWords = ['the', 'and', 'with', 'from', 'that', 'this', 'for', 'are', 'not'];
    const words = text.split(/\s+/).filter((word: string) => {
      const cleanWord = word.replace(/[^a-z]/gi, '').toLowerCase();
      return cleanWord.length > 3 && !stopWords.includes(cleanWord);
    });
    
    for (const word of words) {
      if (!ingredients.some(ing => ing.name.toLowerCase() === word.toLowerCase())) {
        ingredients.push({ name: word });
      }
    }
  }
  
  return ingredients;
}

export default router;
