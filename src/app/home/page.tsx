"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import "../../styles/home.css"; // Importing external CSS file

export default function Home() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setVisible(true);
    }, 500);
  }, []);

  return (
    <div className="bg-darkBlue text-white min-h-screen flex flex-col items-center">

      {/* 🌟 Hero Section */}
      <section className={`relative w-full flex flex-col items-center text-center py-24 px-4 ${visible ? "fade-in" : ""}`}>
        <h1 className="text-6xl font-extrabold text-gold drop-shadow-lg site-title">
          SnackSense 🍿
        </h1>
        <p className="mt-4 text-lg text-gray-300 max-w-2xl">
          AI-powered snack insights. Scan food packets and make healthier choices.
        </p>
        
        <Link href="/upload">
          <button className="elegant-button mt-8">🚀 Upload an Image</button>
        </Link>
      </section>

      {/* 🔄 How It Works Section */}
      <section className="text-center py-16 px-6 w-full bg-gray-900 glass-card fade-in">
        <h2 className="text-4xl font-bold text-gold">How It Works?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {[
            { step: "1️⃣ Upload a food packet", desc: "Take a picture of the back of the packet." },
            { step: "2️⃣ AI analyzes ingredients", desc: "Our AI scans the details for better insights." },
            { step: "3️⃣ Get better alternatives", desc: "See healthier snack options instantly." }
          ].map((item, index) => (
            <div key={index} className={`glass-card fade-in delay-${index}`}>
              <h3 className="text-xl font-semibold text-softOrange">{item.step}</h3>
              <p className="mt-2 text-gray-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 🌟 Benefits Section */}
      <section className="text-center py-16 px-6 w-full">
        <h2 className="text-4xl font-bold text-gold">Why Use SnackSense?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {[
            { title: "🔍 AI Analysis", text: "Our AI scans and evaluates snacks instantly." },
            { title: "🥗 Healthier Choices", text: "Get personalized snack recommendations." },
            { title: "📊 Detailed Insights", text: "See ingredient breakdowns and nutrition facts." }
          ].map((item, index) => (
            <div key={index} className={`glass-card fade-in delay-${index}`}>
              <h3 className="text-xl font-semibold text-softOrange">{item.title}</h3>
              <p className="mt-2 text-gray-300">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
