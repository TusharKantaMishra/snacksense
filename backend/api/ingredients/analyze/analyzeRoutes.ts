import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

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

// Environment variable fallbacks with better error handling
const getGeminiKey = (): string => {
  const apiKey = process.env.GEMINI_API_KEY || 
         process.env.NEXT_PUBLIC_GEMINI_API_KEY;
         
  if (!apiKey) {
    console.error('No Gemini API key found in environment variables');
    throw new Error('Gemini API key is missing. Please configure your environment variables with a valid API key.');
  } else {
    console.log('Gemini API key found with length:', apiKey.length);
  }
  
  return apiKey;
};

// Clean analyzer function for ingredients using Gemini
async function analyzeIngredients(text: string, productInfo?: ProductInfo): Promise<IngredientAnalysis[]> {
  try {
    const apiKey = getGeminiKey();
    
    if (!apiKey) {
      console.error('No Gemini API key available');
      throw new Error('Gemini API key is missing. Please configure your environment variables with a valid API key.');
    }
    
    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048
      }
    });
    
    console.log('Initialized Gemini model: gemini-2.0-flash');
    
        // Check if this is an enhanced format request that already has structured information
    const isEnhancedRequest = text.includes('INGREDIENT ANALYSIS REQUEST') || 
                             text.includes('PRODUCT INFORMATION:') || 
                             text.includes('INGREDIENT LIST');
    
    let prompt = '';
    
    if (isEnhancedRequest) {
      console.log('Received enhanced format request - using pre-formatted context');
      
      // For enhanced requests, add a clear instruction but preserve the structured format
      prompt = `You are a nutrition expert tasked with analyzing the following ingredients. 
      Analyze the provided information carefully and follow these instructions precisely.
      
      ${text}
      
      Return your analysis as a properly formatted JSON array where each element follows this structure:
      {
        "ingredient": string,
        "healthRating": "Good" | "Neutral" | "Bad",
        "explanation": string,
        "details": string[] (optional),
        "healthScore": number (0-100) (optional),
        "dailyValuePercentage": number (optional),
        "benefits": string[] (optional),
        "riskFactors": string[] (optional),
        "processingLevel": string (optional),
        "alternatives": string[] (optional),
        "nutritionalInfo": { (optional)
          "calories": string (optional),
          "protein": string (optional),
          "carbs": string (optional),
          "fats": string (optional),
          "vitamins": string[] (optional),
          "minerals": string[] (optional)
        }
      }

      Return the analysis as properly formatted JSON without any text before or after. Format as a single array.`;
    } else {
      // Legacy format - construct the prompt from scratch
      console.log('Received legacy format request - building structured context');
      
      let productContext = '';
      if (productInfo) {
        productContext = `\nProduct Information:\n`;
        if (productInfo.name) productContext += `Name: ${productInfo.name}\n`;
        if (productInfo.servingSize) productContext += `Serving Size: ${productInfo.servingSize}\n`;
        if (productInfo.format) productContext += `Format: ${productInfo.format}\n`;
        
        if (productInfo.additionalInfo) {
          for (const [key, value] of Object.entries(productInfo.additionalInfo)) {
            productContext += `${key}: ${value}\n`;
          }
        }
      }
      
      prompt = `You are a nutrition expert tasked with analyzing food ingredients. ${productContext}
      
      Analyze each ingredient separately and return a comprehensive JSON array where each element follows this structure:
      {
        "ingredient": string,
        "healthRating": "Good" | "Neutral" | "Bad",
        "explanation": string,
        "details": string[] (optional),
        "healthScore": number (0-100) (optional),
        "dailyValuePercentage": number (optional),
        "benefits": string[] (optional),
        "riskFactors": string[] (optional),
        "processingLevel": string (optional),
        "alternatives": string[] (optional),
        "nutritionalInfo": { (optional)
          "calories": string (optional),
          "protein": string (optional),
          "carbs": string (optional),
          "fats": string (optional),
          "vitamins": string[] (optional),
          "minerals": string[] (optional)
        }
      }

      Return the analysis as properly formatted JSON without any text before or after. Format as a single array.
      Here are the ingredients to analyze: ${text}`;
    }

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
      
      // Handle API errors properly
      if (innerError instanceof Error && innerError.message.includes('timed out')) {
        console.error('Gemini API request timed out');
        throw new Error('Analysis request timed out. Please try again later.');
      }
      
      // For other errors, throw with appropriate message
      console.error('API error occurred');
      throw new Error('Unable to analyze ingredients. Please try again later.');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    throw error;
  }
}

// Interfaces for request body typing
interface AnalyzeRequestBody {
  text: string;
  productInfo?: ProductInfo;
  requestVersion?: number; // Version of the request format (e.g., 2 for enhanced format)
}

// POST /api/ingredients/analyze
router.post('/', async (req: any, res: any) => {
  console.log('📥 Received request to /api/ingredients/analyze');
  const requestStart = Date.now();
  
  try {
    // Type assertion for req.body right at the beginning
    const body = req.body as Partial<AnalyzeRequestBody>;
    
    // Check if this is an enhanced format request
    const isEnhancedFormat = ((req.headers as any)['x-request-format'] === 'enhanced') || body?.requestVersion === 2;
    if (isEnhancedFormat) {
      console.log('Enhanced request format detected');
    }
    
    // Check for API key - either from header or environment
    const providedApiKey = (req.headers as any)['x-api-key'];
    const apiKey = providedApiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ API KEY MISSING: No Gemini API key found');
      return res.status(401).json({ 
        error: 'Gemini API key is missing. Please configure your environment variables or provide a key.'
      });
    }
    
    // Log request body for debugging (without sensitive data)
    console.log('Request body received:', {
      hasText: !!body?.text,
      textLength: body?.text?.length || 0,
      hasProductInfo: !!body?.productInfo,
      isEnhancedFormat
    });
    
    // Extract validated data from the request body
    const text = body.text;
    const productInfo = body.productInfo;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      console.log('❌ Bad request: No ingredients text provided');
      return res.status(400).json({ error: 'No ingredients provided' });
    }
    
    // Analyze the ingredients
    try {
      console.log(`Starting ingredient analysis (${text.length} chars)`);
      const results = await analyzeIngredients(text, productInfo);
      
      // Verify the results
      if (!Array.isArray(results) || results.length === 0) {
        console.warn('❌ Invalid results from Gemini:', results);
        return res.status(500).json({ 
          error: 'Failed to analyze ingredients: Gemini returned an invalid response format.'
        });
      }
      
      // Log successful analysis
      const processingTime = Date.now() - requestStart;
      console.log(`✅ Analysis complete. Processed ${results.length} ingredients in ${processingTime}ms`);
      
      // Return the results
      return res.json(results);
    } catch (analyzeError: any) {
      console.error('❌ Error analyzing ingredients:', analyzeError);
      
      // Check for specific error types to provide better responses
      if (analyzeError.message && analyzeError.message.includes('API key')) {
        return res.status(401).json({ error: analyzeError.message });
      } else if (analyzeError.message && (
          analyzeError.message.includes('overloaded') || 
          analyzeError.message.includes('503') || 
          analyzeError.message.includes('high traffic')
      )) {
        console.log('Gemini API overloaded, checking if we should use fallback data');
        
        // Development-only fallback when Gemini is unavailable
        // Only use this for testing when Gemini API is down
        const useFallbackData = process.env.NODE_ENV === 'development' && process.env.USE_FALLBACK === 'true';
        
        if (useFallbackData) {
          console.log('⚠️ USING FALLBACK DATA - For development only');
          
          // Create a simple fallback response with some example ingredients
          const createFallbackData = (ingredientText: string): IngredientAnalysis[] => {
            // Extract some ingredient names from the text to make the fallback more relevant
            const ingredientNames = ingredientText.split(/[,;]\s*/).filter(i => i.length > 3).slice(0, 5);
            
            if (ingredientNames.length === 0) {
              ingredientNames.push('Example Ingredient');
            }
            
            return ingredientNames.map(name => ({
              ingredient: name.trim(),
              healthRating: ['Good', 'Neutral', 'Bad'][Math.floor(Math.random() * 3)] as 'Good' | 'Neutral' | 'Bad',
              explanation: `This is fallback data for testing purposes only. Real analysis for ${name} would include nutritional information and health impacts.`,
              healthScore: Math.floor(Math.random() * 100),
              details: ['Fallback data - not real analysis', 'Used when Gemini API is unavailable'],
              benefits: ['Example benefit 1', 'Example benefit 2'],
              riskFactors: ['Example risk factor 1'],
              processingLevel: 'Moderately'
            }));
          };
          
          return res.json(createFallbackData(text));
        }
        
        return res.status(503).json({ 
          error: 'The Gemini AI service is currently experiencing high traffic. Please try again in a few minutes.'
        });
      } else if (analyzeError.message && analyzeError.message.includes('timed out')) {
        return res.status(504).json({ 
          error: 'The analysis request timed out. Please try again with fewer ingredients or when the service is less busy.'
        });
      }
      
      // Generic fallback error
      return res.status(500).json({ 
        error: analyzeError instanceof Error ? analyzeError.message : 'An unknown error occurred during analysis' 
      });
    }
  } catch (error) {
    console.error('❌ Unexpected error in /api/ingredients/analyze route:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    });
  }
});

export default router;
