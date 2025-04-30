"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const generative_ai_1 = require("@google/generative-ai");
const router = express_1.default.Router();
// Environment variable fallbacks with better error handling
const getGeminiKey = () => {
    const apiKey = process.env.GEMINI_API_KEY ||
        process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error('No Gemini API key found in environment variables');
        throw new Error('Gemini API key is missing. Please configure your environment variables with a valid API key.');
    }
    else {
        console.log('Gemini API key found with length:', apiKey.length);
    }
    return apiKey;
};
// Clean analyzer function for ingredients using Gemini
async function analyzeIngredients(text, productInfo) {
    try {
        const apiKey = getGeminiKey();
        if (!apiKey) {
            console.error('No Gemini API key available');
            throw new Error('Gemini API key is missing. Please configure your environment variables with a valid API key.');
        }
        // Initialize the Gemini API
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2048
            }
        });
        console.log('Initialized Gemini model: gemini-2.0-flash');
        // Construct a detailed prompt for ingredient analysis
        let productContext = '';
        if (productInfo) {
            productContext = `\nProduct Information:\n`;
            if (productInfo.name)
                productContext += `Name: ${productInfo.name}\n`;
            if (productInfo.servingSize)
                productContext += `Serving Size: ${productInfo.servingSize}\n`;
            if (productInfo.format)
                productContext += `Format: ${productInfo.format}\n`;
            if (productInfo.additionalInfo) {
                for (const [key, value] of Object.entries(productInfo.additionalInfo)) {
                    productContext += `${key}: ${value}\n`;
                }
            }
        }
        const prompt = `You are a nutrition expert tasked with analyzing food ingredients. ${productContext}
    
    Analyze each ingredient separately and return a comprehensive JSON array where each element follows this structure:
    {
      "ingredient": string,
      "healthRating": "Good" | "Neutral" | "Bad",
      "explanation": string,
      "details": string[] (optional),
      "healthScore": number (0-100) (optional),
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
            const maxAttempts = 3;
            let lastError = null;
            let apiResult;
            while (attempts < maxAttempts) {
                try {
                    attempts++;
                    console.log(`Gemini API attempt ${attempts} of ${maxAttempts}`);
                    // Set a timeout for the API request using a simple Promise.race approach
                    const apiPromise = model.generateContent(prompt);
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Gemini API request timed out after 25 seconds')), 25000);
                    });
                    // Race the API call against the timeout
                    apiResult = await Promise.race([apiPromise, timeoutPromise]);
                    // If we get here, the API call was successful, so exit the retry loop
                    break;
                }
                catch (error) {
                    lastError = error;
                    // Only retry on 503 Service Unavailable or rate limit errors
                    if (error instanceof Error &&
                        (error.message.includes('503 Service Unavailable') ||
                            error.message.includes('overloaded') ||
                            error.message.includes('rate limit'))) {
                        console.log(`Gemini API overloaded, retrying in ${attempts * 2} seconds...`);
                        // Wait with exponential backoff before retrying
                        await new Promise(resolve => setTimeout(resolve, attempts * 2000));
                        continue;
                    }
                    // For other errors, don't retry
                    throw error;
                }
            }
            // If we've exhausted all retries without a successful result, throw the last error
            if (!apiResult && lastError) {
                throw lastError;
            }
            else if (!apiResult) {
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
            }
            catch (parseError) {
                console.error('JSON parsing error:', parseError);
                console.error('JSON content that failed to parse:', jsonMatch[0]);
                throw new Error('Failed to parse ingredient analysis from AI response');
            }
        }
        catch (innerError) {
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
    }
    catch (error) {
        console.error('Gemini API error:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message, error.stack);
        }
        throw error;
    }
}
// POST /api/ingredients/analyze
router.post('/', async (req, res) => {
    try {
        // Explicitly type the request body
        const body = req.body; // First cast to any to avoid type errors
        const text = body.text;
        const productInfo = body.productInfo;
        if (!text) {
            return res.status(400).json({ error: 'No ingredients provided' });
        }
        // Handle both comma-separated strings and arrays
        const ingredientList = Array.isArray(text) ? text.join(', ') : text;
        // Analyze the ingredients with product context if available
        const analysis = await analyzeIngredients(ingredientList, productInfo);
        return res.json(analysis);
    }
    catch (error) {
        console.error('Analyze ingredients error:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        });
    }
});
exports.default = router;
//# sourceMappingURL=analyzeRoutes.js.map