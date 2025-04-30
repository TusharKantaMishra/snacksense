/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please import from src/lib/firebase.ts directly instead.
 * 
 * This file now forwards to the centralized Firebase configuration in src/lib/firebase.ts
 */

import { firebaseApp } from '../../lib/firebase';

// Get Firebase configuration from the centralized Firebase app
const firebaseConfig = firebaseApp.options || {};

// Export the configuration for backward compatibility
export { firebaseConfig };

// Log a warning in development mode about using the deprecated file
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'WARNING: Using deprecated Firebase configuration from src/app/firebase/configValues.js. ' +
    'Please update your imports to use src/lib/firebase.ts directly.'
  );
  
  // Log configuration status
  console.log('Firebase configuration loaded from centralized source:', {
    projectId: firebaseConfig.projectId,
    hasApiKey: !!firebaseConfig.apiKey
  });
}

// Add global window access to config (helps with debugging)
if (typeof window !== 'undefined') {
  window.__FIREBASE_CONFIG__ = firebaseConfig;
}

// Log configuration status in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  const missingKeys = Object.keys(firebaseConfig).filter(key => !firebaseConfig[key]);
  if (missingKeys.length > 0) {
    console.warn(`Missing Firebase configuration keys: ${missingKeys.join(', ')}. Using development fallbacks.`);
    console.info('For production: Add your Firebase config to .env.local file with NEXT_PUBLIC_ prefix');
  } else {
    console.info('Firebase configuration loaded successfully');
  }
}

export default firebaseConfig;
