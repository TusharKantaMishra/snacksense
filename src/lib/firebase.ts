import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

/**
 * Primary Firebase configuration file
 * - Uses environment variables from .env.local
 * - NEVER hardcodes sensitive credentials
 * - Provides singleton instances of Firebase services
 */

// Define Firebase config type with index signature
interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  [key: string]: string | undefined;
}

/**
 * Create Firebase config from environment variables
 * All values come from .env.local and are injected by Next.js
 */
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Required Firebase configuration fields
const requiredFields = ['apiKey', 'authDomain', 'projectId'];

/**
 * Initialize Firebase services and return instances
 * Uses singleton pattern to ensure only one instance exists
 */
function initializeFirebase() {
  try {
    // Validate configuration
    const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
    
    if (missingFields.length > 0) {
      console.error(`Firebase initialization error: Missing required fields: ${missingFields.join(', ')}`);
      console.error('Please check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_* variables are set correctly');
      
      if (typeof window !== 'undefined') {
        // Only throw in browser environment to prevent SSR errors
        throw new Error(`Firebase configuration error: Missing ${missingFields.join(', ')}`);
      }
    }
    
    // Initialize Firebase app if not already initialized
    let firebaseApp: FirebaseApp;
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
      console.log('Firebase initialized with project:', firebaseConfig.projectId);
    } else {
      firebaseApp = getApps()[0];
      console.log('Using existing Firebase app instance');
    }
    
    // Initialize and return services
    const firestoreDb = getFirestore(firebaseApp);
    const authService = getAuth(firebaseApp);
    
    return { 
      app: firebaseApp, 
      db: firestoreDb, 
      auth: authService 
    };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    
    // For SSR, provide mock objects that won't break the application
    if (typeof window === 'undefined') {
      return {
        app: {} as FirebaseApp,
        db: {} as Firestore,
        auth: {} as Auth
      };
    }
    
    throw error;
  }
}

// Initialize Firebase and export services
const { app: firebaseApp, db, auth } = initializeFirebase();

export { firebaseApp, db, auth };

