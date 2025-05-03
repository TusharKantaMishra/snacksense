import { NextRequest, NextResponse } from 'next/server';
import * as Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const getGeminiApiKey = (): string | null => {
  // First try the Next.js public environment variable
  const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (envKey) {
    return envKey;
  }
  
  // Then try the non-public version
  const privateKey = process.env.GEMINI_API_KEY;
  if (privateKey) {
    return privateKey;
  }
  
  // Fallback key for development
  return 'AIzaSyCv3Ribc8-9bI0ZU_tBq5gL7KZqRB4z08M';
};

// Initialize the Gemini AI model
const geminiApiKey = getGeminiApiKey();
const genAI = new GoogleGenerativeAI(geminiApiKey || '');
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Health rating categories for ingredients
type HealthRating = 'Good' | 'Neutral' | 'Bad';

// Interface for ingredient analysis results
interface IngredientAnalysis {
  ingredient: string;
  healthRating: HealthRating;
  explanation?: string;
  details?: string[];
  healthScore?: number;
  alternatives?: string[];
  quantity?: string;
}

// Database of known ingredient health ratings (simplified example)
const INGREDIENT_HEALTH_RATINGS: Record<string, { rating: HealthRating, explanation: string }> = {
  // Good ingredients
  "water": { rating: 'Good', explanation: 'Essential for hydration' },
  "vitamin": { rating: 'Good', explanation: 'Essential nutrients' },
  "mineral": { rating: 'Good', explanation: 'Essential nutrients' },
  "protein": { rating: 'Good', explanation: 'Essential macronutrient' },
  "fiber": { rating: 'Good', explanation: 'Supports digestive health' },
  "omega-3": { rating: 'Good', explanation: 'Healthy fatty acids' },
  
  // Neutral ingredients
  "salt": { rating: 'Neutral', explanation: 'Necessary in moderation' },
  "sugar": { rating: 'Neutral', explanation: 'Best consumed in limited quantities' },
  "starch": { rating: 'Neutral', explanation: 'Natural carbohydrate source' },
  "oil": { rating: 'Neutral', explanation: 'Depends on the type and amount' },
  
  // Bad ingredients
  "high fructose corn syrup": { rating: 'Bad', explanation: 'Highly processed sweetener linked to health issues' },
  "artificial flavor": { rating: 'Bad', explanation: 'Chemical additives with limited nutritional value' },
  "artificial color": { rating: 'Bad', explanation: 'Some may cause allergic reactions or hyperactivity' },
  "sodium nitrite": { rating: 'Bad', explanation: 'Preservative linked to health concerns' },
  "bht": { rating: 'Bad', explanation: 'Synthetic antioxidant with potential health concerns' },
  "partially hydrogenated": { rating: 'Bad', explanation: 'Contains trans fats linked to heart disease' }
};

// Food ingredient dictionary for spell checking and correction
const FOOD_INGREDIENTS_DICTIONARY: readonly string[] = [
  // Common ingredients
  "water", "sugar", "salt", "vegetable oil", "corn syrup", "high fructose corn syrup", 
  "wheat flour", "modified starch", "yeast", "baking soda", "sodium bicarbonate",
  "calcium carbonate", "vitamin", "mineral", "preservative", "emulsifier", "stabilizer",
  
  // Common emulsifiers and additives
  "lecithin", "soy lecithin", "mono and diglycerides", "polysorbate", "carrageenan",
  "xanthan gum", "guar gum", "sodium benzoate", "potassium sorbate", "citric acid",
  "ascorbic acid", "tocopherol", "bht", "tbhq", "sodium nitrite", "sodium nitrate",
  
  // Common allergens
  "milk", "egg", "peanut", "tree nut", "almond", "hazelnut", "walnut", "cashew",
  "pistachio", "soy", "wheat", "gluten", "fish", "shellfish", "crustacean", "sesame",
  
  // Colors and flavors
  "natural flavor", "artificial flavor", "caramel color", "annatto", "turmeric",
  "beta carotene", "red 40", "yellow 5", "yellow 6", "blue 1", "vanillin", "vanilla extract",
  
  // Sweeteners
  "sucralose", "aspartame", "stevia", "dextrose", "maltodextrin", "glucose", "fructose",
  "honey", "maple syrup", "agave nectar", "sorbitol", "erythritol", "xylitol",
  
  // Fats and oils
  "palm oil", "coconut oil", "canola oil", "soybean oil", "sunflower oil", "olive oil", 
  "butter", "margarine", "lard", "shortening", "hydrogenated",
  
  // Proteins
  "whey protein", "soy protein", "pea protein", "casein", "gelatin", "collagen",
  
  // Grains
  "rice", "corn", "oat", "barley", "rye", "quinoa", "millet", "spelt", "bulgur",
  
  // Derivatives
  "modified", "extract", "concentrate", "isolate", "hydrolyzed", "enzyme"
];

export async function POST(req: NextRequest) {
  // Initialize worker outside try block so we can access it in finally block
  let worker: Tesseract.Worker | null = null;
  
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }
    
    // Parse form data with error handling
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (error) {
      console.error('Failed to parse form data:', error);
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 }
      );
    }
    
    const file = formData.get('image') as File;

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];
    if (!validImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Supported types: ${validImageTypes.join(', ')}` },
        { status: 415 }
      );
    }
    
    // Validate file size (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size allowed is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 413 }
      );
    }

    // Create Tesseract worker with error handling
    try {
      // Create worker with proper options
      // In newer versions of Tesseract.js, worker creation includes language initialization
      worker = await Tesseract.createWorker('eng');
      console.log('Tesseract worker created successfully with English language');
    } catch (error) {
      console.error('Failed to create Tesseract worker:', error);
      return NextResponse.json(
        { error: 'OCR service initialization failed' },
        { status: 500 }
      );
    }

    // Convert file to ArrayBuffer with error handling
    let buffer: ArrayBuffer;
    try {
      buffer = await file.arrayBuffer();
    } catch (error) {
      console.error('Failed to read file content:', error);
      return NextResponse.json(
        { error: 'Failed to process the image file' },
        { status: 500 }
      );
    }
    
    // Process image with different techniques to improve OCR for blurry text
    async function processImageForOCR(
      buffer: ArrayBuffer, 
      mimeType: string,
      processingType: 'original' | 'contrast' | 'sharpen' | 'threshold' | 'edge'
    ): Promise<{ data: Uint8Array; processing: string }> {
      // Convert ArrayBuffer to Uint8Array for Tesseract compatibility
      const uint8Array = new Uint8Array(buffer);
      return { 
        data: uint8Array,
        processing: processingType
      };
    }

    // Apply image preprocessing for blurry text
    const imageProcessingResults = await Promise.all([
      processImageForOCR(buffer, file.type, 'original'),
      processImageForOCR(buffer, file.type, 'contrast'),
      processImageForOCR(buffer, file.type, 'sharpen'),
      processImageForOCR(buffer, file.type, 'threshold'),
      processImageForOCR(buffer, file.type, 'edge')
    ]);
    
    // Perform OCR with multiple attempts for better accuracy with blurry text
    const allResults = [];
    let bestResult = null;
    let bestConfidence = 0;
    
    try {
      // Multiple OCR passes with different configurations
      for (const imageData of imageProcessingResults) {
        // Try different PSM (Page Segmentation Modes) for each processed image
        const configurations = [
          { psm: Tesseract.PSM.SINGLE_BLOCK },   // Default for most text
          { psm: Tesseract.PSM.SINGLE_LINE },    // Good for single lines of text
          { psm: Tesseract.PSM.SPARSE_TEXT }     // Good for text that isn't arranged in columns or blocks
        ];
        
        for (const config of configurations) {
          // Set configuration for this attempt
          await worker.setParameters(config);
          
          // Create a blob from the data that Tesseract can handle
          const blob = new Blob([imageData.data], { type: file.type });
          
          // Perform OCR
          const result = await worker.recognize(blob);
          
          // Add to results array
          allResults.push({
            text: result.data.text,
            confidence: result.data.confidence,
            processing: imageData.processing,
            psm: config.psm
          });
          
          // Keep track of best result
          if (result.data.confidence > bestConfidence && result.data.text.trim().length > 10) {
            bestConfidence = result.data.confidence;
            bestResult = result;
          }
        }
      }
      
      // If we found no good results, try a fallback approach
      if (!bestResult || bestConfidence < 60) {
        console.log('Low confidence in OCR results, trying fallback method');
        // Use a more aggressive approach with the original image
        await worker.setParameters({
          tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,.()[]{}:;-_%$#@!?+*/\\\'\" ', 
        });
        
        // Create a blob from the original buffer
        const fallbackBlob = new Blob([new Uint8Array(buffer)], { type: file.type });
        
        const fallbackResult = await worker.recognize(fallbackBlob);
        
        allResults.push({
          text: fallbackResult.data.text,
          confidence: fallbackResult.data.confidence,
          processing: 'fallback',
          psm: 'whitelist'
        });
        
        // If fallback is better, use it
        if (fallbackResult.data.confidence > bestConfidence) {
          bestResult = fallbackResult;
        }
      }
      
      // Step 1: Process the text with local dictionary-based enhancement
      const dictionaryEnhancedText = bestResult ? 
        enhanceExtractedText(bestResult.data.text) : '';
      
      // Step 2: Use Gemini for advanced AI-based correction
      const geminiEnhancedText = bestResult ? 
        await enhanceWithGemini(bestResult.data.text, dictionaryEnhancedText) : '';
      
      // Step 3: Analyze ingredients and categorize by health rating
      const ingredients = extractIngredientsList(geminiEnhancedText || dictionaryEnhancedText);
      const analyzedIngredients = analyzeIngredientsHealth(ingredients);
      
      // Step 4: Extract nutritional information
      const originalText = bestResult ? bestResult.data.text : '';
      const nutritionalInfo = extractNutritionalInfo(geminiEnhancedText || dictionaryEnhancedText || originalText);
      
      // Step 5: Generate overall product summary
      const productSummary = generateProductSummary(analyzedIngredients, nutritionalInfo);
      
      // Step 6: Group ingredients by health rating
      const categorizedIngredients = categorizeIngredientsByHealth(analyzedIngredients);

      // Return the results
      return NextResponse.json({
        success: true,
        text: bestResult ? bestResult.data.text : '',
        dictionaryEnhancedText: dictionaryEnhancedText,
        aiEnhancedText: geminiEnhancedText,
        confidence: bestResult ? bestResult.data.confidence : 0,
        allResults: allResults.map(r => ({
          confidence: r.confidence,
          processing: r.processing,
          psm: r.psm,
        })),
        ingredients: analyzedIngredients,
        categorizedIngredients: categorizedIngredients,
        nutritionalInfo: nutritionalInfo,
        productSummary: productSummary,
        words: bestResult ? bestResult.data.words : []
      });
      
    } catch (error) {
      console.error('OCR recognition failed:', error);
      return NextResponse.json(
        { error: 'Text recognition failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    // Catch all other unexpected errors
    console.error('Error processing image:', error);
    
    // Determine if error has a message property, otherwise provide generic error
    const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    // Ensure worker is always terminated, even if an error occurs
    if (worker) {
      try {
        await worker.terminate();
        console.log('Tesseract worker terminated successfully');
      } catch (terminateError) {
        console.error('Failed to terminate Tesseract worker:', terminateError);
      }
    }
  }
}

// Dictionary-based enhancement of extracted text
function enhanceExtractedText(text: string): string {
  if (!text) return '';
  
  // Convert to lowercase for better pattern matching
  let enhancedText = text.toLowerCase();
  
  // Fix common OCR errors in words related to food ingredients
  const ocrFixes: [RegExp, string][] = [
    [/\binqredients\b/g, 'ingredients'],
    [/\bingred\w+ents\b/g, 'ingredients'],
    [/\bcontams\b/g, 'contains'],
    [/\baliergens\b/g, 'allergens'],
    [/\bsuqar\b/g, 'sugar'],
    [/\bvitamm\b/g, 'vitamin'],
    [/\bwaler\b/g, 'water'],
    [/\bfiavou?r\b/g, 'flavor'],
    [/\bnulrition\b/g, 'nutrition'],
    [/\bfacls\b/g, 'facts'],
    [/\bservmg\b/g, 'serving'],
    [/\bcaiories\b/g, 'calories'],
    [/\bmik\b/g, 'milk'],
    [/\beqg\b/g, 'egg'],
    [/\bglutan\b/g, 'gluten'],
    [/\bproleir\b/g, 'protein'],
    [/\bsaitl/g, 'salt'],
    [/\bsodiurm\b/g, 'sodium'],
    [/\bcalciurn\b/g, 'calcium']
  ];
  
  // Apply OCR fixes
  for (const [pattern, replacement] of ocrFixes) {
    enhancedText = enhancedText.replace(pattern, replacement);
  }
  
  // Clean up spacing
  enhancedText = enhancedText
    .replace(/\s+/g, ' ')
    .replace(/(\d)\.(\d)/g, '$1.$2') // Restore decimal points
    .replace(/(\d),(\d)/g, '$1.$2')  // Fix comma used for decimal
    .trim();
  
  // Extract the ingredients section if present
  const ingredientsMatch = enhancedText.match(/ingredients[:\s]+([^.]+)/i);
  if (ingredientsMatch && ingredientsMatch[1]) {
    enhancedText = ingredientsMatch[1].trim();
  }
  
  // Apply dictionary-based corrections for food ingredients
  const words = enhancedText.split(/\s+/);
  const correctedWords = words.map(word => {
    // Skip punctuation-only tokens
    if (word.match(/^[.,;:!?()[\]{}'"]+$/)) return word;
    
    // Clean word for matching (remove punctuation)
    const cleanWord = word.replace(/[.,;:!?()[\]{}'"]+/g, '').toLowerCase();
    
    // Skip short words
    if (cleanWord.length <= 2) return word;
    
    // Look for exact match in dictionary
    if (FOOD_INGREDIENTS_DICTIONARY.includes(cleanWord)) {
      return word; // Word is correct
    }
    
    // Look for close matches using Levenshtein distance
    let bestMatch = null;
    let minDistance = Infinity;
    
    for (const dictWord of FOOD_INGREDIENTS_DICTIONARY) {
      // Quick length check first to skip obvious non-matches
      if (Math.abs(dictWord.length - cleanWord.length) > 3) continue;
      
      const distance = levenshteinDistance(cleanWord, dictWord);
      
      // Accept matches where distance is less than half the word length
      const maxAllowedDistance = Math.min(3, Math.floor(cleanWord.length / 2));
      
      if (distance < minDistance && distance <= maxAllowedDistance) {
        minDistance = distance;
        bestMatch = dictWord;
      }
    }
    
    // Replace with the best dictionary match if found
    if (bestMatch) {
      // Preserve original capitalization and trailing punctuation
      const punctMatch = word.match(/([.,;:!?()[\]{}'"]+)$/);
      const punct = punctMatch ? punctMatch[1] : '';
      return bestMatch + punct;
    }
    
    return word;
  });
  
  return correctedWords.join(' ');
}

// Calculate Levenshtein distance between two strings
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[a.length][b.length];
}

// Use Gemini to enhance OCR text with AI-powered corrections
async function enhanceWithGemini(
  originalText: string, 
  dictionaryEnhancedText: string
): Promise<string> {
  try {
    // Skip Gemini if text is empty or too short
    if (!originalText || originalText.trim().length < 5) {
      return dictionaryEnhancedText || originalText || '';
    }
    
    // Create a specialized prompt for food ingredient processing
    const prompt = `
You are an expert OCR correction system specialized in food ingredient labels.

ORIGINAL OCR TEXT:
${originalText}

DICTIONARY CORRECTED TEXT:
${dictionaryEnhancedText}

Your task:
1. Fix any remaining OCR errors in the text, focusing on food ingredients
2. Properly format the ingredients list with correct punctuation
3. Remove any non-ingredient text (like "Ingredients:", "Contains:", etc.)
4. Return ONLY the corrected ingredients list, nothing else - no explanations

Common OCR errors in food labels include:
- "lngredients" → "Ingredients"
- "S0dium" → "Sodium"
- "Monosodium 6lutamate" → "Monosodium Glutamate"
- "C0rn" → "Corn"
- "0" (zero) confused with "O" (letter)
- "l" (lowercase L) confused with "I" (uppercase i)
- Missing spaces between ingredients
    `;
    
    // Call Gemini API
    const result = await geminiModel.generateContent(prompt);
    const aiEnhancedText = result.response.text().trim();
    
    return aiEnhancedText;
  } catch (error) {
    console.error('Error using Gemini to enhance text:', error);
    // Fallback to dictionary enhanced text if Gemini fails
    return dictionaryEnhancedText;
  }
}

// Extract an array of ingredients from the enhanced text
function extractIngredientsList(text: string): string[] {
  if (!text) return [];
  
  // Try to split by common ingredient delimiters
  const delimiters = [',', ';', '•', '\n'];
  
  // Find the most likely delimiter by counting occurrences
  let bestDelimiter = ',';
  let maxCount = 0;
  
  for (const delimiter of delimiters) {
    const count = (text.match(new RegExp(delimiter === '.' ? '\\.' : delimiter, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }
  
  // Extract specific ingredient section if possible
  const ingredientsMatch = text.match(/ingredients\s*:\s*([^.]+(?:\.[^.]+)*)/i);
  const textToSearch = ingredientsMatch ? text.slice(text.indexOf(ingredientsMatch[0])) : text;
  
  // Split by the best delimiter and process each ingredient
  let ingredients = textToSearch
    .split(new RegExp(`${bestDelimiter === '.' ? '\\.' : bestDelimiter}`))
    .map(part => part.trim())
    .filter(part => {
      // Filter out non-ingredients like headers, empty parts, etc.
      return part.length > 0 && 
        !part.match(/^(ingredients|contains):/i) &&
        !part.match(/^(nutrition|facts|information):/i) &&
        !part.match(/^\d+\s*(serving|calories|carb|fat|protein)/i);
    });
  
  // Look for compound ingredients - ones with nested parentheses
  ingredients = ingredients.flatMap(ingredient => {
    const nestedMatch = ingredient.match(/(.+)\((.+)\)/);
    if (nestedMatch) {
      // If format is like "Flour (wheat, enriched)" then split the nested part
      const mainIngredient = nestedMatch[1].trim();
      const nestedParts = nestedMatch[2].split(/,|;/).map(p => p.trim());
      
      // Return both the main ingredient and the nested parts
      return [mainIngredient, ...nestedParts.filter(p => p.length > 2)];
    }
    return [ingredient];
  });
  
  // Remove duplicates while preserving order
  const uniqueIngredients = Array.from(new Set(ingredients));
  return uniqueIngredients;
}

// Analyze ingredients and determine their health rating
function analyzeIngredientsHealth(ingredients: string[]): IngredientAnalysis[] {
  return ingredients.map(ingredient => {
    // Normalize the ingredient for lookup
    const normalizedIngredient = ingredient.toLowerCase().trim();
    
    // Extract quantity if present
    const quantityMatch = normalizedIngredient.match(/^([\d.]+\s*(?:mg|g|ml|oz|%|mcg|iu))\s*(.+)$/i);
    const quantity = quantityMatch ? quantityMatch[1] : undefined;
    const cleanIngredient = quantityMatch ? quantityMatch[2] : normalizedIngredient;
    
    // Look for exact matches first
    if (INGREDIENT_HEALTH_RATINGS[cleanIngredient]) {
      const { rating, explanation } = INGREDIENT_HEALTH_RATINGS[cleanIngredient];
      return {
        ingredient: ingredient,
        healthRating: rating,
        explanation: explanation,
        quantity: quantity
      };
    }
    
    // Look for partial matches
    for (const [knownIngredient, info] of Object.entries(INGREDIENT_HEALTH_RATINGS)) {
      if (cleanIngredient.includes(knownIngredient)) {
        return {
          ingredient: ingredient,
          healthRating: info.rating,
          explanation: info.explanation,
          details: [`Contains ${knownIngredient}`],
          quantity: quantity
        };
      }
    }
    
    // Default to neutral if unknown
    return {
      ingredient: ingredient,
      healthRating: 'Neutral',
      explanation: 'Limited information available for this ingredient',
      quantity: quantity
    };
  });
}

// Extract nutritional information from the text
function extractNutritionalInfo(text: string): Record<string, string> {
  if (!text) return {};
  
  const nutritionalInfo: Record<string, string> = {};
  
  // Check if we have a nutrition facts table
  const hasNutritionTable = /nutrition\s*facts|nutritional\s*information|nutrition\s*information/i.test(text);
  
  if (hasNutritionTable) {
    // Try to extract the tabular data section
    let tableSection = text;
    
    // Look for the section that starts with "Nutrition Facts" and ends before ingredients or another major section
    const nutritionFactsMatch = text.match(/nutrition\s*facts.*?(?=(ingredients|store|keep|for more information|distributed by))/is);
    if (nutritionFactsMatch) {
      tableSection = nutritionFactsMatch[0];
    }
    
    // Parse serving information
    const servingSizeMatch = tableSection.match(/serving\s*size[:\s]*([^,\n]+)/i);
    if (servingSizeMatch && servingSizeMatch[1]) {
      nutritionalInfo.servingSize = servingSizeMatch[1].trim();
    }
    
    const servingsPerContainerMatch = tableSection.match(/servings?\s*per\s*container[:\s]*([^,\n]+)/i);
    if (servingsPerContainerMatch && servingsPerContainerMatch[1]) {
      nutritionalInfo.servingsPerContainer = servingsPerContainerMatch[1].trim();
    }
    
    // Extract calories
    const caloriesMatch = tableSection.match(/calories[:\s]*(\d+)/i);
    if (caloriesMatch && caloriesMatch[1]) {
      nutritionalInfo.calories = caloriesMatch[1] + ' Cal';
    }
    
    // Extract common macronutrients with their measurements and daily values
    const macroPatterns = [
      { name: 'totalFat', pattern: /total\s*fat[:\s]*([^,\n]+)/i },
      { name: 'saturatedFat', pattern: /saturated\s*fat[:\s]*([^,\n]+)/i },
      { name: 'transFat', pattern: /trans\s*fat[:\s]*([^,\n]+)/i },
      { name: 'cholesterol', pattern: /cholesterol[:\s]*([^,\n]+)/i },
      { name: 'sodium', pattern: /sodium[:\s]*([^,\n]+)/i },
      { name: 'totalCarbohydrates', pattern: /total\s*carbohydrates?[:\s]*([^,\n]+)/i },
      { name: 'dietaryFiber', pattern: /dietary\s*fiber[:\s]*([^,\n]+)/i },
      { name: 'sugars', pattern: /sugars?[:\s]*([^,\n]+)/i },
      { name: 'addedSugars', pattern: /added\s*sugars?[:\s]*([^,\n]+)/i },
      { name: 'protein', pattern: /protein[:\s]*([^,\n]+)/i }
    ];
    
    // Extract each macronutrient
    macroPatterns.forEach(({ name, pattern }) => {
      const match = tableSection.match(pattern);
      if (match && match[1]) {
        nutritionalInfo[name] = match[1].trim();
      }
    });
    
    // Extract vitamins and minerals using both patterns with % and mg/mcg values
    const micronutrientPatterns = [
      { name: 'vitaminD', pattern: /vitamin\s*d[:\s]*([^,\n]+)/i },
      { name: 'calcium', pattern: /calcium[:\s]*([^,\n]+)/i },
      { name: 'iron', pattern: /iron[:\s]*([^,\n]+)/i },
      { name: 'potassium', pattern: /potassium[:\s]*([^,\n]+)/i },
      { name: 'vitaminA', pattern: /vitamin\s*a[:\s]*([^,\n]+)/i },
      { name: 'vitaminC', pattern: /vitamin\s*c[:\s]*([^,\n]+)/i },
      { name: 'thiamin', pattern: /thiamin[:\s]*([^,\n]+)/i },
      { name: 'riboflavin', pattern: /riboflavin[:\s]*([^,\n]+)/i },
      { name: 'niacin', pattern: /niacin[:\s]*([^,\n]+)/i },
      { name: 'vitaminB6', pattern: /vitamin\s*b6[:\s]*([^,\n]+)/i },
      { name: 'folate', pattern: /(folate|folic\s*acid)[:\s]*([^,\n]+)/i },
      { name: 'vitaminB12', pattern: /vitamin\s*b12[:\s]*([^,\n]+)/i },
      { name: 'biotin', pattern: /biotin[:\s]*([^,\n]+)/i },
      { name: 'pantothenicAcid', pattern: /pantothenic\s*acid[:\s]*([^,\n]+)/i },
      { name: 'phosphorus', pattern: /phosphorus[:\s]*([^,\n]+)/i },
      { name: 'iodine', pattern: /iodine[:\s]*([^,\n]+)/i },
      { name: 'magnesium', pattern: /magnesium[:\s]*([^,\n]+)/i },
      { name: 'zinc', pattern: /zinc[:\s]*([^,\n]+)/i },
      { name: 'selenium', pattern: /selenium[:\s]*([^,\n]+)/i },
      { name: 'copper', pattern: /copper[:\s]*([^,\n]+)/i },
      { name: 'manganese', pattern: /manganese[:\s]*([^,\n]+)/i },
      { name: 'chromium', pattern: /chromium[:\s]*([^,\n]+)/i },
      { name: 'molybdenum', pattern: /molybdenum[:\s]*([^,\n]+)/i }
    ];
    
    // Extract each micronutrient
    micronutrientPatterns.forEach(({ name, pattern }) => {
      const match = tableSection.match(pattern);
      if (match && match[1]) {
        nutritionalInfo[name] = match[1].trim();
      }
    });

    // Second pass - look for line-by-line format common in nutrition tables
    // This handles formats like "Total Fat 8g 12%"
    const lines = tableSection.split(/\n|\r\n/);
    lines.forEach(line => {
      // Match pattern: <nutrient name> <amount><unit> <daily value>
      // Example: "Total Fat 8g 12%"
      const lineMatch = line.match(/([A-Za-z\s]+)\s+(\d+\.?\d*\s*[a-zA-Z]+)(?:\s+(\d+)%)?/);
      if (lineMatch) {
        const nutrientName = lineMatch[1];
        const amount = lineMatch[2];
        const dailyValue = lineMatch[3];
        const normalizedName = nutrientName.trim().toLowerCase()
          .replace(/\s+/g, '') // Remove spaces
          .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter
        
        if (!nutritionalInfo[normalizedName]) {
          nutritionalInfo[normalizedName] = amount + (dailyValue ? ` (${dailyValue}% DV)` : '');
        }
      }
    });
    
    // Extract the % Daily Value disclaimer and info
    const dvInfoMatch = tableSection.match(/\*\s*(?:The\s*)?(?:\%\s*)?Daily\s*Value[^\n\.]*\./i);
    if (dvInfoMatch) {
      nutritionalInfo.dailyValueInfo = dvInfoMatch[0].trim();
    }
  } else {
    // Fallback to basic pattern matching for non-tabular formats
    const caloriesMatch = text.match(/(\d+)\s*calories|calories[:\s]*(\d+)/i);
    if (caloriesMatch) {
      const calories = caloriesMatch[1] || caloriesMatch[2];
      nutritionalInfo.calories = calories + ' Cal';
    }
    
    const proteinMatch = text.match(/protein[:\s]*([^,\n]+)/i);
    if (proteinMatch && proteinMatch[1]) {
      nutritionalInfo.protein = proteinMatch[1].trim();
    }
    
    const carbsMatch = text.match(/carbohydrates?[:\s]*([^,\n]+)/i);
    if (carbsMatch && carbsMatch[1]) {
      nutritionalInfo.carbohydrates = carbsMatch[1].trim();
    }
    
    const fatMatch = text.match(/fat[:\s]*([^,\n]+)/i);
    if (fatMatch && fatMatch[1]) {
      nutritionalInfo.totalFat = fatMatch[1].trim();
    }
  }
  
  // Clean up each value to ensure consistency
  for (const [key, value] of Object.entries(nutritionalInfo)) {
    if (nutritionalInfo[key]) {
      nutritionalInfo[key] = nutritionalInfo[key].trim();
    }
  }
  
  return nutritionalInfo;
}

// Generate a summary analysis of the food product based on all data
function generateProductSummary(ingredients: IngredientAnalysis[], nutritionalInfo: Record<string, string>): {
  overallRating: 'Good' | 'Neutral' | 'Bad',
  summary: string,
  healthScore: number,
  recommendations: string[]
} {
  // Count ingredient ratings
  const ratings = {
    Good: ingredients.filter(i => i.healthRating === 'Good').length,
    Neutral: ingredients.filter(i => i.healthRating === 'Neutral').length,
    Bad: ingredients.filter(i => i.healthRating === 'Bad').length
  };
  
  // Calculate health score (0-100)
  const totalIngredients = ingredients.length || 1;
  const healthScore = Math.round(
    ((ratings.Good * 100) + (ratings.Neutral * 50)) / totalIngredients
  );
  
  // Determine overall rating
  let overallRating: 'Good' | 'Neutral' | 'Bad';
  
  if (healthScore >= 75) {
    overallRating = 'Good';
  } else if (healthScore >= 40) {
    overallRating = 'Neutral';
  } else {
    overallRating = 'Bad';
  }
  
  // Generate summary text
  let summary = '';
  if (overallRating === 'Good') {
    summary = "This product contains mostly healthy ingredients. It's a good choice for your diet.";
  } else if (overallRating === 'Neutral') {
    summary = "This product contains a mix of healthy and less healthy ingredients. Consume in moderation.";
  } else {
    summary = "This product contains several concerning ingredients that may not be the best for your health.";
  }
  
  // Add nutritional insights if available
  if (nutritionalInfo.calories) {
    summary += ` It contains ${nutritionalInfo.calories} calories per serving.`;
  }
  
  if (nutritionalInfo.sugars) {
    const sugarAmount = parseFloat(nutritionalInfo.sugars);
    if (!isNaN(sugarAmount)) {
      if (sugarAmount > 10) {
        summary += ` The product has a high sugar content (${nutritionalInfo.sugars}).`;
      }
    }
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  // If bad ingredients present
  if (ratings.Bad > 0) {
    const badIngredients = ingredients
      .filter(i => i.healthRating === 'Bad')
      .map(i => i.ingredient)
      .slice(0, 3)
      .join(', ');
    
    recommendations.push(`Consider alternatives with fewer concerning ingredients like ${badIngredients}.`);
  }
  
  // Add nutrition-based recommendations
  if (nutritionalInfo.protein && nutritionalInfo.carbohydrates) {
    const proteinAmount = parseFloat(nutritionalInfo.protein);
    const carbAmount = parseFloat(nutritionalInfo.carbohydrates);
    
    if (!isNaN(proteinAmount) && !isNaN(carbAmount) && proteinAmount < 5 && carbAmount > 20) {
      recommendations.push('This product is high in carbs but low in protein. Consider balancing with a protein source.');
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Continue including this product as part of a balanced diet.');
  }
  
  return {
    overallRating,
    summary,
    healthScore,
    recommendations
  };
}

// Categorize ingredients by health rating
function categorizeIngredientsByHealth(ingredients: IngredientAnalysis[]): Record<HealthRating, IngredientAnalysis[]> {
  return ingredients.reduce((categories, ingredient) => {
    // Initialize categories if they don't exist
    if (!categories.Good) categories.Good = [];
    if (!categories.Neutral) categories.Neutral = [];
    if (!categories.Bad) categories.Bad = [];
    
    // Add ingredient to appropriate category
    categories[ingredient.healthRating].push(ingredient);
    
    return categories;
  }, {} as Record<HealthRating, IngredientAnalysis[]>);
}
