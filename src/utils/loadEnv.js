// Utility to load environment variables from .env.local
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export function loadEnvFile() {
  try {
    // Path to .env.local file
    const envLocalPath = path.resolve(process.cwd(), '.env.local');
    
    // Check if file exists
    if (fs.existsSync(envLocalPath)) {
      // Load env vars from file
      const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
      
      // Apply the env vars to the process.env
      Object.keys(envConfig).forEach(key => {
        if (!process.env[key]) {
          process.env[key] = envConfig[key];
        }
      });
      
      console.log('Loaded environment variables from .env.local');
      return true;
    } else {
      console.warn('.env.local file not found');
      return false;
    }
  } catch (error) {
    console.error('Error loading .env.local file:', error);
    return false;
  }
}

// Export as a named export instead of CommonJS
const envUtils = { loadEnvFile };
export default envUtils;
