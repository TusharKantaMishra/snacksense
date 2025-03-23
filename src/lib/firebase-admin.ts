import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Check if Firebase Admin is already initialized
const apps = getApps();
let adminApp;
let adminDb: Firestore;

if (!apps.length) {
  try {
    // For development, we'll initialize with a fallback project ID if not provided
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'snacksense-demo';
    
    adminApp = initializeApp({
      projectId: projectId
    });
    
    adminDb = getFirestore(adminApp);
    
    // In development, connect to the emulator if available
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      adminDb.settings({
        host: process.env.FIRESTORE_EMULATOR_HOST,
        ssl: false
      });
    }
    
    console.log('Firebase Admin initialized successfully with project ID:', projectId);
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    // Instead of throwing an error, set up a mock adminDb for fallback functionality
    const mockAdminApp = initializeApp({ projectId: 'mock-project' }, 'mock-app');
    adminDb = getFirestore(mockAdminApp);
    console.warn('Using mock Firebase Admin due to initialization error');
  }
} else {
  adminApp = apps[0];
  adminDb = getFirestore(adminApp);
}

export { adminDb };
