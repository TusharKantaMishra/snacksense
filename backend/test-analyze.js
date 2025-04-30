// Test script for ingredients/analyze endpoint
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testAnalyzeIngredients() {
  console.log('\n----- Testing Ingredient Analysis -----');
  
  // Check for Gemini API key
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ ERROR: No Gemini API key found in environment');
    process.exit(1);
  }
  
  console.log(`✅ Found API key (length: ${apiKey.length})`);
  
  try {
    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048
      }
    });
    
    console.log('✅ Initialized Gemini model: gemini-2.0-flash');
    
    // Test with a simple ingredient list
    const testIngredients = "Starlisea-Homogenise | 11, Flavoured Toned Milk, Nutritional Information";
    
    // Create the prompt - simplified version of what's in the actual route
    const prompt = `You are a nutrition expert tasked with analyzing food ingredients.
    
    Analyze each ingredient separately and return a comprehensive JSON array where each element follows this structure:
    {
      "ingredient": string,
      "healthRating": "Good" | "Neutral" | "Bad",
      "explanation": string,
      "healthScore": number (0-100),
      "benefits": string[] (optional),
      "riskFactors": string[] (optional)
    }
    
    Analyze these food ingredients: ${testIngredients}`;
    
    console.log('📤 Sending test prompt to Gemini API...');
    
    // Implement retry logic
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;
    let apiResult;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Gemini API attempt ${attempts} of ${maxAttempts}`);
        
        // Set a timeout for the API request
        const apiPromise = model.generateContent(prompt);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out after 25 seconds')), 25000);
        });
        
        // Race the API call against the timeout
        apiResult = await Promise.race([apiPromise, timeoutPromise]);
        
        // If we get here, the API call was successful, so exit the retry loop
        break;
      } catch (error) {
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
    } else if (!apiResult) {
      throw new Error('Maximum retry attempts reached without a result');
    }
    
    const response = await apiResult.response;
    const responseText = response.text();
    
    console.log('\n✅ Received valid response from Gemini API:');
    console.log('-------------------------------------------');
    console.log(responseText);
    console.log('-------------------------------------------');
    
    // Try to extract JSON
    try {
      const jsonMatch = responseText.match(/\[.*\]/s);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        console.log('\n✅ Parsed JSON data successfully:', parsedData.length, 'ingredients analyzed');
      } else {
        console.error('❌ Could not extract JSON from response');
      }
    } catch (error) {
      console.error('❌ JSON parsing error:', error.message);
    }
    
    console.log('\n✅ TEST PASSED: Gemini API is working correctly for ingredient analysis');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED: Error with Gemini API');
    console.error('Error details:', error.message);
    
    if (error.message) {
      if (error.message.includes('API_KEY_INVALID')) {
        console.error('🔑 Your API key appears to be invalid. Check that it is correct and has access to Gemini.');
      } else if (error.message.includes('503 Service Unavailable') || error.message.includes('overloaded')) {
        console.error('⚠️ The Gemini API is currently overloaded. This is a temporary issue with Google\'s servers.');
        console.error('   Please try again later when the service load has decreased.');
      }
    }
    
    process.exit(1);
  }
}

// Run the test
testAnalyzeIngredients();
