# Firebase Setup Guide for SnackSense

## Issue Fixed

The main error you were encountering (`FirebaseError: Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)`) was due to missing or invalid Firebase credentials. This occurs when the application tries to initialize Firebase without proper API keys.

## How to Fix

Follow these steps to set up Firebase properly:

### 1. Create Firebase Project (if you don't have one already)

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable Authentication and Firestore for your project

### 2. Set Up Frontend Firebase Configuration

1. In your Firebase project console, go to Project Settings
2. Under "Your apps", add a web app if you don't have one already
3. Copy the Firebase configuration object (contains apiKey, authDomain, etc.)
4. Create a `.env.local` file in the root directory of your SnackSense project using the `.env.example` template:

```
# Copy from .env.example to .env.local and add your values
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 3. Set Up Backend Firebase Admin SDK

1. In Firebase Console, go to Project Settings > Service Accounts
2. Click "Generate new private key" button
3. Save the downloaded JSON file securely
4. Create a `.env.local` file in the `backend` directory using the `.env.example` template:

```
# Copy from .env.example to .env.local and add your values
BACKEND_PORT=5000

# Copy these from your service account JSON file
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key-from-json-file"
FIREBASE_CLIENT_EMAIL=your-client-email@example.com
```

### 4. Start the Application

Start both the frontend and backend servers:

```bash
# Start the frontend (in the root directory)
npm run dev

# Start the backend (in another terminal)
cd backend
npm run dev
```

## Improvements Made

1. **Enhanced Error Handling**: Improved error messages for Firebase initialization issues.
2. **Robust Configuration**: Better handling of missing environment variables.
3. **Frontend-Backend Integration**: Ensured proper communication between frontend and backend.
4. **Authentication Flow**: Improved sign-in component to handle authentication errors gracefully.

## Troubleshooting

If you continue to experience issues:

1. Check the browser console for specific error messages
2. Verify that your Firebase project has Authentication enabled
3. Ensure your Firebase API key is correct and has the necessary permissions
4. Check that both `.env.local` files have the correct values

Remember to never commit these `.env.local` files to version control, as they contain sensitive information.
