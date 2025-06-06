"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDb = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
// Check if Firebase Admin is already initialized
const apps = (0, app_1.getApps)();
let adminApp;
let adminDb;
const initializeAdminApp = () => {
    // Check for required environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY ?
        process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // Debug logging to troubleshoot initialization
    console.log('Firebase Admin debug - Environment variables:');
    console.log(`- FIREBASE_PROJECT_ID: ${projectId ? 'Found' : 'Missing'}`);
    console.log(`- FIREBASE_PRIVATE_KEY: ${privateKey ? 'Found (length: ' + privateKey.length + ')' : 'Missing'}`);
    console.log(`- FIREBASE_CLIENT_EMAIL: ${clientEmail ? 'Found' : 'Missing'}`);
    // Log configuration status
    if (!projectId)
        console.warn('Firebase Admin: Missing project ID');
    if (!privateKey)
        console.warn('Firebase Admin: Missing private key');
    if (!clientEmail)
        console.warn('Firebase Admin: Missing client email');
    // If we have service account credentials, use them
    if (projectId && privateKey && clientEmail) {
        return (0, app_1.initializeApp)({
            credential: (0, app_1.cert)({
                projectId,
                privateKey,
                clientEmail
            })
        });
    }
    // Otherwise, use application default credentials (works in GCP) or minimal config
    return (0, app_1.initializeApp)({
        projectId: projectId || 'snacksense-demo'
    });
};
if (!apps.length) {
    try {
        console.log('Attempting to initialize Firebase Admin SDK...');
        adminApp = initializeAdminApp();
        exports.adminDb = adminDb = (0, firestore_1.getFirestore)(adminApp);
        // In development, connect to the emulator if available
        if (process.env.FIRESTORE_EMULATOR_HOST) {
            console.log(`Connecting to Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
            adminDb.settings({
                host: process.env.FIRESTORE_EMULATOR_HOST,
                ssl: false
            });
        }
        console.log('Firebase Admin initialized successfully');
    }
    catch (error) {
        console.error('Firebase Admin initialization error:', error);
        // Instead of throwing an error, set up a mock adminDb for fallback functionality
        const mockAdminApp = (0, app_1.initializeApp)({ projectId: 'mock-project' }, 'mock-app');
        exports.adminDb = adminDb = (0, firestore_1.getFirestore)(mockAdminApp);
        console.warn('Using mock Firebase Admin due to initialization error');
        console.warn('Please set up .env.local file with proper Firebase credentials based on .env.example');
    }
}
else {
    adminApp = apps[0];
    exports.adminDb = adminDb = (0, firestore_1.getFirestore)(adminApp);
}
//# sourceMappingURL=firebase-admin.js.map