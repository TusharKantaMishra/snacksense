// Simple test script to check if Gemini API is working
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function testGeminiApi() {
  console.log('\n🧪 GEMINI API TEST\n' + '='.repeat(30));
  
  // Check if API key is available
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ No Gemini API key found in environment variables');
    console.log('Make sure you have GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file');
    return;
  }
  
  console.log(`✅ Found API key (length: ${apiKey.length})`);
  
  try {
    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ Initialized GoogleGenerativeAI client');
    
    // Get the Gemini model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.2
      }
    });
    console.log('✅ Created model instance');
    
    // Try a simple prompt
    console.log('📤 Sending test request to Gemini API...');
    const prompt = "Analyze these food ingredients and return a single sentence response: sugar, flour, eggs";
    
    // Set a timeout for the API request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 10 seconds')), 10000);
    });
    
    // Make the API call with a timeout
    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ]);
    
    // Process the response
    const response = await result.response;
    const responseText = response.text();
    
    console.log('\n✅ Received valid response from Gemini API:');
    console.log('-------------------------------------------');
    console.log(responseText);
    console.log('-------------------------------------------');
    console.log('\n✅ TEST PASSED: Gemini API is working correctly');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED: Error connecting to Gemini API');
    console.error('Error details:');
    if (error.message) {
      console.error(error.message);
    }
    if (error.status) {
      console.error(`Status: ${error.status}`);
    }
    
    // Check for common API key errors
    if (error.message && error.message.includes('API_KEY_INVALID')) {
      console.error('\n🔑 Your API key appears to be invalid or not authorized for Gemini.');
      console.error('Get a valid key from: https://makersuite.google.com/app/apikey');
    }
    
    console.error('\nFull error:', error);
  }
}

// Run the test
testGeminiApi();
