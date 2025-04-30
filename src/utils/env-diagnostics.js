"use client";

/**
 * Utility to diagnose environment variable loading issues
 * This helps us verify if environment variables are properly loaded
 * without exposing sensitive values in logs
 */

export function checkEnvVariables() {
  const envVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
  ];

  const results = {};
  
  envVars.forEach(varName => {
    const value = process.env[varName];
    
    // Mask the value for security, but show if it exists and its length
    results[varName] = {
      exists: !!value,
      length: value ? value.length : 0,
      preview: value ? `${value.substring(0, 3)}...${value.substring(value.length - 3)}` : null,
    };
  });
  
  console.table(results);
  
  // Check if critical variables are missing
  const missingCritical = ['NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID']
    .filter(varName => !results[varName].exists);
    
  if (missingCritical.length > 0) {
    console.error(`Critical environment variables missing: ${missingCritical.join(', ')}`);
    return false;
  }
  
  return true;
}
