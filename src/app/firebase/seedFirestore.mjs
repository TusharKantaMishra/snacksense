import { doc, setDoc } from "firebase/firestore";
import { db } from "./config.js"; // Adjust the path to your firebase.js file

// Your JSON data
const homepageContent = {
  hero: {
    title: "SnackSense 🍿",
    description: "AI-powered snack insights. Scan food packets and make healthier choices.",
    buttonText: "🚀 Upload an Image"
  },
  howItWorks: {
    title: "How It Works?",
    steps: [
      { step: "1️⃣ Upload a food packet", desc: "Take a picture of the back of the packet." },
      { step: "2️⃣ AI analyzes ingredients", desc: "Our AI scans the details for better insights." },
      { step: "3️⃣ Get better alternatives", desc: "See healthier snack options instantly." }
    ]
  },
  benefits: {
    title: "Why Use SnackSense?",
    items: [
      { title: "🔍 AI Analysis", text: "Our AI scans and evaluates snacks instantly." },
      { title: "🥗 Healthier Choices", text: "Get personalized snack recommendations." },
      { title: "📊 Detailed Insights", text: "See ingredient breakdowns and nutrition facts." }
    ]
  }
};

// Function to add data to Firestore
async function addHomepageContent() {
  try {
    // Write to 'homepageContent' collection, document ID 'main'
    await setDoc(doc(db, "homepageContent", "main"), homepageContent);
    console.log("Data successfully added to Firestore!");
  } catch (error) {
    console.error("Error adding data to Firestore: ", error);
  }
}

// Run the function
addHomepageContent();