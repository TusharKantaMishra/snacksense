"use client";

/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please import from src/lib/firebase.ts directly instead.
 * 
 * This file now forwards to the centralized Firebase configuration in src/lib/firebase.ts
 * to ensure all Firebase usage in the app uses the same configuration.
 */

// Import the Firebase configuration from the centralized location
import { firebaseApp } from '../../lib/firebase';

// Function to get the Firebase config for backward compatibility
const buildRuntimeConfig = () => {
  // Get config from centralized Firebase app
  // This ensures all Firebase configuration comes from a single source
  if (firebaseApp && firebaseApp.options) {
    return firebaseApp.options;
  }
  
  // Fallback to environment variables if needed
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };
};

// Create Firebase configuration using our centralized configuration
const FIREBASE_CONFIG = buildRuntimeConfig();

// Check if we have a valid configuration
const hasValidConfig = FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId;

/**
 * This function provides Firebase configuration for backward compatibility
 * It delegates to the centralized Firebase configuration in src/lib/firebase.ts
 */
export function getFirebaseConfig() {
  if (hasValidConfig) {
    return FIREBASE_CONFIG;
  }
  
  // Log a warning that this method is deprecated
  console.warn(
    'WARNING: Using deprecated getFirebaseConfig() from env-config.js. ' +
    'Please update your code to import from src/lib/firebase.ts directly.'
  );
  
  // For development environments only
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'Firebase configuration not found. Environment variables may not be loading properly. ' +
      'Please check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_* variables are set.'
    );
  }
  
  // Return a basic configuration object that will trigger proper error handling in components
  return {
    apiKey: null,
    authDomain: null,
    projectId: null,
    storageBucket: null,
    messagingSenderId: null,
    appId: null,
    measurementId: null
  };
}
