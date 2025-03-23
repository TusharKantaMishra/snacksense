/**
 * Utility functions for handling environment variables with fallbacks
 */

// Get environment variable with client-side fallback
export const getEnvVariable = (key: string, defaultValue: string = ''): string => {
  // Server-side environment variables
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key] || defaultValue;
    if (process.env[`NEXT_PUBLIC_${key}`]) return process.env[`NEXT_PUBLIC_${key}`] || defaultValue;
  }
  
  // Client-side environment variables
  if (typeof window !== 'undefined') {
    // Check runtime injected environment variables
    if (window.__ENV__ && window.__ENV__[key]) return window.__ENV__[key];
    
    // Check Next.js public environment variables
    if (process.env[`NEXT_PUBLIC_${key}`]) return process.env[`NEXT_PUBLIC_${key}`] || defaultValue;
  }
  
  return defaultValue;
};

// Add type definition for global window object
declare global {
  interface Window {
    __ENV__?: Record<string, string>;
  }
}
