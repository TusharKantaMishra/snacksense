// Development script to enable fallback data when Gemini API is unavailable
const fs = require('fs');
const path = require('path');

console.log('Setting up fallback mode for SnackSense development...');

// Create a .env.local file for the frontend with USE_FALLBACK=true
const frontendEnvPath = path.join(__dirname, '..', '.env.local');
const frontendEnvContent = `# Development-only settings
NODE_ENV=development
USE_FALLBACK=true
`;

// Create a .env file for the backend with USE_FALLBACK=true
const backendEnvPath = path.join(__dirname, '.env.development');
const backendEnvContent = `# Development-only settings
NODE_ENV=development
USE_FALLBACK=true
`;

// Write the files
try {
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  console.log('✅ Created frontend fallback settings in .env.local');
} catch (err) {
  console.error('❌ Error writing frontend env file:', err.message);
}

try {
  fs.writeFileSync(backendEnvPath, backendEnvContent);
  console.log('✅ Created backend fallback settings in .env.development');
} catch (err) {
  console.error('❌ Error writing backend env file:', err.message);
}

console.log('\n🚀 Fallback mode enabled. Your app will now use mock data when Gemini API is unavailable.');
console.log('⚠️ NOTE: This is for development purposes only. The production app should use real Gemini API data.\n');
console.log('To use fallback mode, start your backend with:');
console.log('   node -r dotenv/config server.js dotenv_config_path=.env.development');
