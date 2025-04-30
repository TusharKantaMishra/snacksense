/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please import from src/lib/firebase.ts directly instead.
 * 
 * This file now forwards to the centralized Firebase configuration in src/lib/firebase.ts
 * to ensure all Firebase usage in the app uses the same configuration.
 */

import { firebaseApp, auth, db } from '../../lib/firebase';

// Forward the app as 'app' for backward compatibility
const app = firebaseApp;

// Export our Firebase services from the centralized configuration
export { app, auth, db };

// Log a warning in development mode about using the deprecated file
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'WARNING: Using deprecated Firebase configuration from src/app/firebase/config.js. ' +
    'Please update your imports to use src/lib/firebase.ts instead.'
  );
}