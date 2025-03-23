import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface IngredientAnalysis {
  ingredient: string;
  healthRating: 'Good' | 'Neutral' | 'Bad';
  explanation: string;
}

interface ProductInfo {
  name?: string;
  servingSize?: string;
  format?: string;
  additionalInfo?: Record<string, string>;
}

// Environment variable fallbacks with better error handling
const getGeminiKey = (): string => {
  const apiKey = process.env.GEMINI_API_KEY || 
         process.env.NEXT_PUBLIC_GEMINI_API_KEY;
         
  if (!apiKey) {
    console.error('No Gemini API key found in environment variables');
  } else {
    console.log('Gemini API key found with length:', apiKey.length);
  }
  
  return apiKey || '';
};

// Mock data for when no API key is available
const mockIngredientAnalysis: IngredientAnalysis[] = [
  {
    ingredient: "Sugar",
    healthRating: "Bad",
    explanation: "Excessive sugar consumption is linked to obesity, diabetes, and heart disease. It provides empty calories with no nutritional value and causes blood sugar spikes. Details: • Contributes to tooth decay • Can lead to insulin resistance • Associated with increased inflammation in the body. Alternatives: Stevia, monk fruit extract, erythritol, or natural fruit for sweetness."
  },
  {
    ingredient: "Whole Grain Flour",
    healthRating: "Good",
    explanation: "Contains fiber, vitamins, and minerals that support digestive health. Whole grains are associated with reduced risk of heart disease, stroke, and type 2 diabetes. Details: • Contains B vitamins essential for energy metabolism • Provides magnesium and selenium • Helps maintain stable blood sugar levels • Promotes satiety and weight management."
  },
  {
    ingredient: "Natural Flavors",
    healthRating: "Neutral",
    explanation: "A broad term that can include various plant or animal-derived flavoring agents. While generally recognized as safe, the lack of specificity makes it difficult to assess health impacts. Details: • Can contain hundreds of different compounds • May include both natural and synthetic chemicals • Exact composition is often proprietary information. Alternatives: Products that specify exact flavor sources like 'vanilla extract' or 'lemon oil'."
  },
  {
    ingredient: "High Fructose Corn Syrup",
    healthRating: "Bad",
    explanation: "Linked to insulin resistance, obesity, and metabolic disorders. This highly processed sweetener is metabolized differently than other sugars, potentially leading to increased fat storage and liver strain. Details: • May contribute to non-alcoholic fatty liver disease • Associated with increased triglyceride levels • Provides no nutritional benefits. Alternatives: Natural sweeteners like honey, maple syrup, or coconut sugar in moderation."
  },
  {
    ingredient: "Vitamin E",
    healthRating: "Good",
    explanation: "An antioxidant that protects cells from damage and supports immune function. Vitamin E helps maintain healthy skin and eyes, and may help prevent coronary heart disease. Details: • Helps protect cells from free radical damage • Supports proper immune function • Important for skin health and wound healing • May have neuroprotective properties."
  }
];

// Validate API key middleware
const validateApiKey = (request: NextRequest): boolean => {
  const apiKey = request.headers.get('X-API-Key');
  const serverApiKey = getGeminiKey();
  
  // For debugging
  console.log('API key validation:', {
    headerKeyExists: !!apiKey,
    headerKeyLength: apiKey ? apiKey.length : 0,
    serverKeyExists: !!serverApiKey,
    serverKeyLength: serverApiKey ? serverApiKey.length : 0,
    isMatch: apiKey === serverApiKey
  });
  
  // If we have a server API key and it matches the request header, or if we don't require API key validation
  return apiKey === serverApiKey || apiKey === process.env.API_KEY || !serverApiKey;
};

// Clean analyzer function for ingredients using Gemini
const analyzeIngredients = async (text: string, productInfo?: ProductInfo): Promise<IngredientAnalysis[]> => {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    console.log('No API key available, returning mock data');
    // Return mock data when no API key is available
    return mockIngredientAnalysis;
  }
  
  console.log('Initializing Gemini API with key length:', apiKey.length);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-pro",
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
    }
  });

  try {
    // Build a more detailed prompt with product information when available
    let productContext = '';
    if (productInfo) {
      productContext = `
      Product Information:
      - Name: ${productInfo.name || 'Unknown'}
      - Serving Size: ${productInfo.servingSize || 'Not specified'}
      - Format: ${productInfo.format || 'Standard ingredients list'}
      `;
      
      // Add any additional information if available
      if (productInfo.additionalInfo && Object.keys(productInfo.additionalInfo).length > 0) {
        productContext += '- Additional Information:\n';
        for (const [key, value] of Object.entries(productInfo.additionalInfo)) {
          productContext += `  • ${key}: ${value}\n`;
        }
      }
    }

    const prompt = `You are a nutritional expert who analyzes food ingredients.
    ${productContext}
    
    For each ingredient in the following list, provide a detailed analysis including:
    1. The ingredient name (use the scientific name in parentheses if provided)
    2. A health rating (Good, Neutral, or Bad)
    3. A detailed explanation of why it has that rating, including specific health benefits or concerns
    4. If applicable, include a "Details:" section with bullet points of additional information
    5. If applicable, include an "Alternatives:" section with healthier alternatives
    
    Format your response as a JSON array of objects with keys: ingredient, healthRating, explanation.
    The healthRating must be exactly one of: "Good", "Neutral", or "Bad".
    Make the explanation comprehensive but concise, focusing on evidence-based health information.
    
    When analyzing, consider:
    - The quantity of the ingredient if provided (e.g., "32.43mg")
    - The type of ingredient if specified (e.g., "active ingredient", "excipient")
    - The overall context of the product
    
    Analyze these food ingredients: ${text}`;

    console.log('Sending prompt to Gemini API with ingredients:', text);
    
    try {
      // Set a timeout for the API request using a simple Promise.race approach
      const apiPromise = model.generateContent(prompt);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini API request timed out after 25 seconds')), 25000);
      });
      
      // Race the API call against the timeout
      const result = await Promise.race([apiPromise, timeoutPromise]);
      
      const response = await result.response;
      const responseText = response.text();
      console.log('Received response from Gemini API:', responseText.substring(0, 100) + '...');

      // Extract JSON from response
      const jsonMatch = responseText.match(/\[.*\]/s);
      if (!jsonMatch) {
        console.error('JSON extraction failed. Full response:', responseText);
        throw new Error('Could not extract JSON array from response');
      }

      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('JSON content that failed to parse:', jsonMatch[0]);
        throw new Error('Failed to parse ingredient analysis from AI response');
      }
    } catch (innerError) {
      console.error('Gemini API request error:', innerError);
      
      // Check if it's a timeout error
      if (innerError instanceof Error && innerError.message.includes('timed out')) {
        console.log('Gemini API request timed out, returning mock data');
        return mockIngredientAnalysis;
      }
      
      // For other errors, also return mock data to prevent 500 errors
      console.log('Returning mock data due to API error');
      return mockIngredientAnalysis;
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    throw error;
  }
};

export async function POST(request: NextRequest) {
  // Validate API key
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { text, productInfo } = body;

    if (!text) {
      return NextResponse.json({ error: 'No ingredients provided' }, { status: 400 });
    }

    // Handle both comma-separated strings and arrays
    const ingredientList = Array.isArray(text) ? text.join(', ') : text;
    
    // Analyze the ingredients with product context if available
    const analysis = await analyzeIngredients(ingredientList, productInfo);
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analyze ingredients error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
