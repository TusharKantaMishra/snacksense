// Test backend environment variables
require('dotenv').config();

console.log('\n----- Backend Environment Test -----');
console.log('Checking for Gemini API key...');

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ ERROR: No Gemini API key found in backend environment');
  console.log('Make sure you have GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY in your backend/.env file');
  console.log('\nAvailable environment variables:');
  console.log(Object.keys(process.env)
    .filter(key => !key.includes('SECRET') && !key.includes('KEY') && !key.includes('PASSWORD'))
    .join(', '));
} else {
  console.log(`✅ Found API key (length: ${apiKey.length})`);
  console.log(`Key starts with: ${apiKey.substring(0, 4)}...`);
}

console.log('\n----- End of Test -----');
