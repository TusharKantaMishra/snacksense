"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "../firebase/config"; // Ensure path is correct
import { doc, getDoc } from "firebase/firestore";
import styles from "../../styles/home.module.css";

export default function Home() {
  const [visible, setVisible] = useState(false);
  interface Content {
    hero: {
      title: string;
      description: string;
      buttonText: string;
    };
    howItWorks: {
      title: string;
      steps: { step: string; desc: string }[];
    };
    benefits: {
      title: string;
      items: { title: string; text: string }[];
    };
  }

  const [content, setContent] = useState<Content | null>(null);
  const [error, setError] = useState<string | null>(null); // Add error state for better debugging

  useEffect(() => {
    async function fetchContent() {
      try {
        const docRef = doc(db, "homepageContent", "main");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent(docSnap.data() as Content);
        } else {
          setError("No content found in Firestore!");
          console.log("No content found!");
        }
      } catch (err) {
        setError("Failed to fetch data: " + (err instanceof Error ? err.message : "Unknown error"));
        console.error("Error fetching Firestore data: ", err);
      }
    }

    fetchContent();

    // Fade-in effect
    const timer = setTimeout(() => {
      setVisible(true);
    }, 500);

    // Cleanup timer to prevent memory leaks
    return () => clearTimeout(timer);
  }, []);

  // Handle loading and error states
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>{error}</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className={styles.loadingContainer}>
        <p className={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Futuristic background elements */}
      <div className={styles.circuitContainer}>
        <div className={styles.circuitLine}></div>
        <div className={styles.circuitLine}></div>
        <div className={styles.circuitLine}></div>
        <div className={styles.circuitLine}></div>
        <div className={styles.circuitVertical}></div>
        <div className={styles.circuitVertical}></div>
        <div className={styles.circuitVertical}></div>
        <div className={styles.circuitVertical}></div>
        <div className={styles.circuitNode}></div>
        <div className={styles.circuitNode}></div>
        <div className={styles.circuitNode}></div>
        <div className={styles.circuitNode}></div>
      </div>
      
      {/* Floating data particles */}
      <div className={styles.dataParticle}></div>
      <div className={styles.dataParticle}></div>
      <div className={styles.dataParticle}></div>
      <div className={styles.dataParticle}></div>
      <div className={styles.dataParticle}></div>
      <div className={styles.dataParticle}></div>
      <div className={styles.dataParticle}></div>
      <div className={styles.dataParticle}></div>
      <div className={styles.dataParticle}></div>
      
      {/* 🌟 Hero Section */}
      <section className={`${styles.heroSection} ${visible ? styles.fadeIn : ""}`}>
        <h1 className={`${styles.heroTitle} ${styles.futuristicHeading}`}>{content.hero.title}</h1>
        <p className={styles.heroDescription}>{content.hero.description}</p>
        <Link href="/upload">
          <button className={styles.heroButton}>{content.hero.buttonText}</button>
        </Link>
      </section>

      {/* 🔄 How It Works Section */}
      <section className={styles.howItWorksSection}>
        <h2 className={`${styles.sectionTitle} ${styles.futuristicHeading}`}>{content.howItWorks.title}</h2>
        <div className={styles.gridContainer}>
          {content.howItWorks.steps.map((item, index) => (
            <div
              key={index}
              className={`${styles.gridItem} ${styles[`delay${index}`]} ${styles.glowBorder} ${styles.scannerEffect}`}
            >
              <h3 className={styles.gridTitle}>{item.step}</h3>
              <p className={styles.gridText}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 🌟 Benefits Section */}
      <section className={styles.benefitsSection}>
        <h2 className={`${styles.sectionTitle} ${styles.futuristicHeading}`}>{content.benefits.title}</h2>
        <div className={styles.gridContainer}>
          {content.benefits.items.map((item, index) => (
            <div
              key={index}
              className={`${styles.gridItem} ${styles[`delay${index}`]} ${styles.glowBorder} ${styles.scannerEffect}`}
            >
              <h3 className={styles.gridTitle}>{item.title}</h3>
              <p className={styles.gridText}>{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}