import { NextRequest, NextResponse } from 'next/server';

interface IngredientData {
  name: string;
  scientificName?: string;
  quantity?: string;
  percentage?: string;
  type?: string; // e.g., "active ingredient", "excipient", etc.
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }
    
    // Extract composition and ingredients information
    const result = extractIngredientsData(text);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Ingredients extraction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract ingredients' },
      { status: 500 }
    );
  }
}

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
    // Split the powders section by commas and process each ingredient
    const powdersList = powdersMatch[1].split(',');
    
    for (const powder of powdersList) {
      // Match pattern: Ingredient (Scientific name) quantity
      const ingredientMatch = powder.match(/([^(]+)\s*(?:\(([^)]+)\))?\s*([0-9.]+\s*(?:mg|g|mcg|%|ml))?/i);
      
      if (ingredientMatch) {
        const ingredient: IngredientData = {
          name: ingredientMatch[1]?.trim() || '',
          type: 'powder'
        };
        
        if (ingredientMatch[2]) {
          ingredient.scientificName = ingredientMatch[2].trim();
        }
        
        if (ingredientMatch[3]) {
          ingredient.quantity = ingredientMatch[3].trim();
        }
        
        if (ingredient.name) {
          ingredients.push(ingredient);
        }
      }
    }
  } else {
    // Look for patterns like "Ingredient (Scientific name) quantity"
    const ingredientPattern = /([^,(]+)\s*(?:\(([^)]+)\))?\s*([0-9.]+\s*(?:mg|g|mcg|%|ml))?/gi;
    
    // Match all occurrences
    let match;
    while ((match = ingredientPattern.exec(compositionText)) !== null) {
      if (match[1]) {
        const ingredient: IngredientData = {
          name: match[1].trim()
        };
        
        if (match[2]) {
          ingredient.scientificName = match[2].trim();
        }
        
        if (match[3]) {
          ingredient.quantity = match[3].trim();
        }
        
        ingredients.push(ingredient);
      }
    }
  }
  
  // Handle special case for "Excipients: q.s." format
  const excipientsMatch = text.match(/excipients:\s*([^.\n]+)/i);
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
  
  // Split by common delimiters
  const parts = text.split(/,|\(|\)|\n/).filter(part => part.trim().length > 0);
  
  for (let part of parts) {
    part = part.trim();
    if (!part || part.toLowerCase().includes('may contain')) continue;
    
    // Remove common words that aren't ingredients
    part = part.replace(/^and\s+|^contains\s+|^including\s+/i, '').trim();
    
    if (part) {
      ingredients.push({ name: part });
    }
  }
  
  return ingredients;
}
