// Import the functions you need from the Firebase SDKs
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

// Firebase configuration using Next.js environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key-for-build",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "snacksense-demo",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy-storage-bucket.appspot.com",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional, only if using Analytics
};

// Create mock objects for SSR
const mockApp = {};
const mockAuth = {};
const mockDb = {};

// Initialize Firebase only in browser environment to avoid SSR issues
let app = mockApp;
let auth = mockAuth;
let db = mockDb;

// Only initialize Firebase if we're in a browser environment
if (typeof window !== 'undefined') {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
        console.log("Firebase initialized successfully in browser");
    } catch (error) {
        console.error("Firebase initialization error:", error);
        // Keep using the mock instances for build process
    }
}

export { app, auth, db };