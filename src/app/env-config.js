"use client";

// This file initializes and exposes environment variables to client-side code
// It should be imported at the app root level

// Initialize window.ENV if it doesn't exist
if (typeof window !== 'undefined' && !window.ENV) {
  window.ENV = {
    // Get Firebase configuration from Next.js environment variables
    // These will be properly injected by Next.js from .env.local during build time
    FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
  
  console.log('Client-side ENV initialized', {
    projectId: window.ENV.FIREBASE_PROJECT_ID,
    hasApiKey: !!window.ENV.FIREBASE_API_KEY
  });
}

// Export a function to get environment variables
export function getEnv(key, fallback = null) {
  if (typeof window !== 'undefined' && window.ENV) {
    return window.ENV[key] || fallback;
  }
  return fallback;
}

// Export Firebase config specifically
export function getFirebaseConfig() {
  return {
    apiKey: getEnv('FIREBASE_API_KEY'),
    authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
    projectId: getEnv('FIREBASE_PROJECT_ID'),
    storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('FIREBASE_APP_ID'),
    measurementId: getEnv('FIREBASE_MEASUREMENT_ID')
  };
}
