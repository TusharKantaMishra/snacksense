import { doc, setDoc, getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Setup to load .env file for secure configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

// Securely load Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Verify required configuration is present
const requiredConfigs = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingConfigs = requiredConfigs.filter(key => !firebaseConfig[key]);

if (missingConfigs.length > 0) {
  console.error(`Error: Missing Firebase configuration: ${missingConfigs.join(', ')}`);
  console.error('Please set these values in your .env.local file');
  process.exit(1);
}

// Initialize Firebase and get db
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Your JSON data
const homepageContent = {
  hero: {
    title: "SnackSense ",
    description: "AI-powered snack insights. Scan food packets and make healthier choices.",
    buttonText: " Upload an Image"
  },
  howItWorks: {
    title: "How It Works?",
    steps: [
      { step: "1 Upload a food packet", desc: "Take a picture of the back of the packet." },
      { step: "2 AI analyzes ingredients", desc: "Our AI scans the details for better insights." },
      { step: "3 Get better alternatives", desc: "See healthier snack options instantly." }
    ]
  },
  benefits: {
    title: "Why Use SnackSense?",
    items: [
      { title: " AI Analysis", text: "Our AI scans and evaluates snacks instantly." },
      { title: " Healthier Choices", text: "Get personalized snack recommendations." },
      { title: " Detailed Insights", text: "See ingredient breakdowns and nutrition facts." }
    ]
  }
};

// Function to add data to Firestore
async function addHomepageContent() {
  try {
    console.log('Attempting to seed Firestore with homepage content...');
    console.log(`Using Firebase project: ${firebaseConfig.projectId}`);
    
    // Write to 'homepageContent' collection, document ID 'main'
    await setDoc(doc(db, "homepageContent", "main"), homepageContent);
    console.log("Data successfully added to Firestore!");
  } catch (error) {
    console.error("Error adding data to Firestore: ", error);
    process.exit(1);
  }
}

// Run the function
addHomepageContent();