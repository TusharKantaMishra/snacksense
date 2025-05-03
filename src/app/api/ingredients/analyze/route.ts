import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  healthScore?: number; // 0-100 numerical health score
  dailyValuePercentage?: number; // Percentage of recommended daily intake
  riskFactors?: string[]; // Potential health risk factors
  benefits?: string[]; // Potential health benefits
  scientificEvidence?: {
    level: 'Strong' | 'Moderate' | 'Limited' | 'Insufficient';
    studies?: string[];
  };
  sustainabilityScore?: number; // 0-100 environmental impact score
  processingLevel?: 'Minimally' | 'Moderately' | 'Highly' | 'Ultra'; // Food processing level
  allergenRisk?: 'High' | 'Medium' | 'Low' | 'None'; // Allergen risk level
  alternatives?: string[]; // Healthier alternatives
}

interface ProductInfo {
  name?: string;
  servingSize?: string;
  format?: string;
  additionalInfo?: Record<string, string>;
}

// Get Gemini API key from environment variables with detailed logging
const getGeminiKey = (): string => {
  // Try the non-public key first (preferred for API routes)
  const serverKey = process.env.GEMINI_API_KEY;
  if (serverKey) {
    console.log('Using GEMINI_API_KEY from environment variables');
    return serverKey;
  }
  
  // Then try the public key (for client-side access)
  const publicKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (publicKey) {
    console.log('Using NEXT_PUBLIC_GEMINI_API_KEY from environment variables');
    return publicKey;
  }
  
  // Log detailed error for debugging
  console.error('No Gemini API key found in environment variables. Check your .env.local file.');
  console.error('Available environment variables:', Object.keys(process.env).filter(key => 
    !key.includes('_KEY') && !key.includes('SECRET') && !key.includes('PASSWORD')
  ));
  
  // Return empty string to indicate missing key
  return '';
};

// Mock data for when no API key is available
// Commented out as it's not currently used, but keeping for future reference
/* const mockIngredientAnalysis: IngredientAnalysis[] = [
  {
    ingredient: "Sugar",
    healthRating: "Bad",
    explanation: "Excessive sugar consumption is linked to obesity, diabetes, and heart disease. It provides empty calories with no nutritional value and causes blood sugar spikes. Details: • Contributes to tooth decay • Can lead to insulin resistance • Associated with increased inflammation in the body. Alternatives: Stevia, monk fruit extract, erythritol, or natural fruit for sweetness.",
    healthScore: 20,
    dailyValuePercentage: 10,
    nutritionalInfo: {
      calories: '45 kcal',
      carbs: '12g',
    },
    benefits: [],
    riskFactors: ['Tooth decay', 'Insulin resistance', 'Inflammation'],
    scientificEvidence: {
      level: 'Strong',
      studies: ['Study 1', 'Study 2'],
    },
    processingLevel: 'Highly',
    allergenRisk: 'None',
    sustainabilityScore: 40,
    alternatives: ['Stevia', 'Monk fruit extract'],
  },
  {
    ingredient: "Whole Grain Flour",
    healthRating: "Good",
    explanation: "Contains fiber, vitamins, and minerals that support digestive health. Whole grains are associated with reduced risk of heart disease, stroke, and type 2 diabetes. Details: • Contains B vitamins essential for energy metabolism • Provides magnesium and selenium • Helps maintain stable blood sugar levels • Promotes satiety and weight management.",
    healthScore: 80,
    dailyValuePercentage: 20,
    nutritionalInfo: {
      calories: '100 kcal',
      protein: '5g',
      carbs: '20g',
      fats: '2g',
      vitamins: ['B1', 'B2', 'B3'],
      minerals: ['Magnesium', 'Selenium'],
    },
    benefits: ['Supports digestive health', 'Reduces risk of heart disease'],
    riskFactors: [],
    scientificEvidence: {
      level: 'Strong',
      studies: ['Study 3', 'Study 4'],
    },
    processingLevel: 'Minimally',
    allergenRisk: 'Low',
    sustainabilityScore: 80,
    alternatives: [],
  },
  {
    ingredient: "Natural Flavors",
    healthRating: "Neutral",
    explanation: "A broad term that can include various plant or animal-derived flavoring agents. While generally recognized as safe, the lack of specificity makes it difficult to assess health impacts. Details: • Can contain hundreds of different compounds • May include both natural and synthetic chemicals • Exact composition is often proprietary information. Alternatives: Products that specify exact flavor sources like 'vanilla extract' or 'lemon oil'.",
    healthScore: 50,
    dailyValuePercentage: 0,
    nutritionalInfo: {},
    benefits: [],
    riskFactors: ['Unknown compounds'],
    scientificEvidence: {
      level: 'Limited',
      studies: [],
    },
    processingLevel: 'Moderately',
    allergenRisk: 'Medium',
    sustainabilityScore: 60,
    alternatives: ['Vanilla extract', 'Lemon oil'],
  },
  {
    ingredient: "High Fructose Corn Syrup",
    healthRating: "Bad",
    explanation: "Linked to insulin resistance, obesity, and metabolic disorders. This highly processed sweetener is metabolized differently than other sugars, potentially leading to increased fat storage and liver strain. Details: • May contribute to non-alcoholic fatty liver disease • Associated with increased triglyceride levels • Provides no nutritional benefits. Alternatives: Natural sweeteners like honey, maple syrup, or coconut sugar in moderation.",
    healthScore: 10,
    dailyValuePercentage: 15,
    nutritionalInfo: {
      calories: '60 kcal',
      carbs: '15g',
    },
    benefits: [],
    riskFactors: ['Insulin resistance', 'Obesity', 'Metabolic disorders'],
    scientificEvidence: {
      level: 'Strong',
      studies: ['Study 5', 'Study 6'],
    },
    processingLevel: 'Ultra',
    allergenRisk: 'None',
    sustainabilityScore: 20,
    alternatives: ['Honey', 'Maple syrup'],
  },
  {
    ingredient: "Vitamin E",
    healthRating: "Good",
    explanation: "An antioxidant that protects cells from damage and supports immune function. Vitamin E helps maintain healthy skin and eyes, and may help prevent coronary heart disease. Details: • Helps protect cells from free radical damage • Supports proper immune function • Important for skin health and wound healing • May have neuroprotective properties.",
    healthScore: 90,
    dailyValuePercentage: 25,
    nutritionalInfo: {
      calories: '0 kcal',
      vitamins: ['Vitamin E'],
    },
    benefits: ['Protects cells from damage', 'Supports immune function'],
    riskFactors: [],
    scientificEvidence: {
      level: 'Strong',
      studies: ['Study 7', 'Study 8'],
    },
    processingLevel: 'Minimally',
    allergenRisk: 'None',
    sustainabilityScore: 90,
    alternatives: [],
  }
]; */

// Validate API key middleware
const validateApiKey = (request: NextRequest): boolean => {
  // Skip validation entirely in development mode for easier testing
  if (process.env.NODE_ENV === 'development') {
    console.log('API key validation skipped in development mode');
    return true;
  }
  
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
  
  // Consider validation passed if any of these conditions are met:
  // 1. The client API key matches the server API key
  // 2. The client API key matches the API_KEY env variable (for admin access)
  // 3. No server API key is configured (validation is disabled)
  return apiKey === serverApiKey || apiKey === process.env.API_KEY || !serverApiKey;
};

// Clean analyzer function for ingredients using Gemini API
const analyzeIngredients = async (text: string, productInfo?: ProductInfo): Promise<IngredientAnalysis[]> => {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is required. Please set GEMINI_API_KEY in your environment variables.');
  }
  
  console.log('Initializing Gemini API with key length:', apiKey.length);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: {
      maxOutputTokens: 4096, // Increased token limit for more detailed analysis
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

    const prompt = `You are a nutritional expert who analyzes food ingredients with scientific precision.
    ${productContext}
    
    For each ingredient in the following list, provide a comprehensive analysis including:
    1. The ingredient name (use the scientific name in parentheses if provided)
    2. A health rating (Good, Neutral, or Bad)
    3. A detailed explanation of why it has that rating
    4. A numerical health score from 0-100 (0 being extremely unhealthy, 100 being extremely healthy)
    5. Estimated daily value percentage if applicable (e.g., "15% of recommended daily intake")
    6. Nutritional information including estimated calories, protein, carbs, fats, vitamins, and minerals
    7. A list of potential health benefits (if any)
    8. A list of potential risk factors (if any)
    9. Scientific evidence level (Strong, Moderate, Limited, or Insufficient)
    10. Processing level (Minimally, Moderately, Highly, or Ultra processed)
    11. Allergen risk level (High, Medium, Low, or None)
    12. Sustainability score from 0-100 (environmental impact, 0 being worst, 100 being best)
    13. Healthier alternatives (if applicable)
    
    Format your response as a JSON array of objects with the following structure:
    {
      "ingredient": string,
      "healthRating": "Good" | "Neutral" | "Bad",
      "explanation": string,
      "healthScore": number,
      "dailyValuePercentage": number (optional),
      "nutritionalInfo": {
        "calories": string (optional),
        "protein": string (optional),
        "carbs": string (optional),
        "fats": string (optional),
        "vitamins": string[] (optional),
        "minerals": string[] (optional)
      },
      "benefits": string[] (optional),
      "riskFactors": string[] (optional),
      "scientificEvidence": {
        "level": "Strong" | "Moderate" | "Limited" | "Insufficient",
        "studies": string[] (optional)
      },
      "processingLevel": "Minimally" | "Moderately" | "Highly" | "Ultra",
      "allergenRisk": "High" | "Medium" | "Low" | "None",
      "sustainabilityScore": number (optional),
      "alternatives": string[] (optional)
    }
    
    When analyzing, consider:
    - The quantity of the ingredient if provided (e.g., "32.43mg")
    - The type of ingredient if specified (e.g., "active ingredient", "excipient")
    - The overall context of the product
    - The latest scientific research and nutritional guidelines
    - Both short-term and long-term health impacts
    - Environmental sustainability factors
    - Potential allergen concerns
    
    Analyze these food ingredients: ${text}`;

    console.log('Sending prompt to Gemini API with ingredients:', text);
    
    try {
      // Implement retry logic for transient errors
      let attempts = 0;
      const maxAttempts = 5; // Increased from 3 to 5 attempts
      let lastError: Error | null = null;
      let apiResult;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`Gemini API attempt ${attempts} of ${maxAttempts}`);
          
          // Set a timeout for the API request using a simple Promise.race approach
          const apiPromise = model.generateContent(prompt);
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Gemini API request timed out after 30 seconds')), 30000);
          });
          
          // Race the API call against the timeout
          apiResult = await Promise.race([apiPromise, timeoutPromise]);
          
          // If we get here, the API call was successful, so exit the retry loop
          break;
        } catch (error) {
          lastError = error as Error;
          
          // Only retry on 503 Service Unavailable or rate limit errors
          if (error instanceof Error && 
              (error.message.includes('503 Service Unavailable') || 
               error.message.includes('overloaded') || 
               error.message.includes('rate limit'))) {
            
            // If this is the last attempt, surface a more user-friendly error
            if (attempts >= maxAttempts) {
              console.log('Maximum retry attempts reached for overloaded Gemini API');
              throw new Error('Gemini AI service is currently experiencing high traffic. Please try again in a few minutes.');
            }
            
            // Calculate exponential backoff with jitter for better retry distribution
            const baseDelay = Math.min(attempts * 3, 15); // 3, 6, 9, 12, 15 seconds
            const jitter = Math.random() * 2; // Add 0-2 seconds of random jitter
            const delaySeconds = baseDelay + jitter;
            
            console.log(`Gemini API overloaded, retrying in ${delaySeconds.toFixed(1)} seconds (attempt ${attempts}/${maxAttempts})...`);
            // Wait with exponential backoff before retrying
            await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
            continue;
          }
          
          // For other errors, don't retry
          throw error;
        }
      }
      
      // If we've exhausted all retries without a successful result, throw the last error
      if (!apiResult && lastError) {
        // Ensure error message is user-friendly
        if (lastError.message.includes('503 Service Unavailable') || lastError.message.includes('overloaded')) {
          throw new Error('Gemini AI service is currently experiencing high traffic. Please try again in a few minutes.');
        }
        throw lastError;
      } else if (!apiResult) {
        throw new Error('Maximum retry attempts reached without a result');
      }
      
      const response = await apiResult.response;
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
      
      // Handle timeout errors with a clear message
      if (innerError instanceof Error && innerError.message.includes('timed out')) {
        throw new Error('Analysis request to Gemini API timed out. Please try again or check your network connection.');
      }
      
      // For API key validation issues, provide a specific error
      if (innerError instanceof Error && 
          (innerError.message.includes('API_KEY_INVALID') || innerError.message.includes('API key not valid'))) {
        throw new Error('Invalid Gemini API key. Please ensure you are using a valid key with access to the Gemini models.');
      }
      
      // For other errors, provide the original error message
      if (innerError instanceof Error) {
        throw new Error(`Gemini API error: ${innerError.message}`);
      } else {
        throw new Error('Unknown error during ingredient analysis');  
      }
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
