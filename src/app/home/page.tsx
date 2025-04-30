"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../../styles/home.module.css";
import Image from "next/image";
import type { Firestore } from "firebase/firestore";

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
    testimonials: {
      title: string;
      items: { name: string; role: string; image: string; quote: string }[];
    };
    statistics: {
      title: string;
      items: { value: string; label: string }[];
    };
    featuredInsights: {
      title: string;
      items: { icon: string; title: string; text: string }[];
    };
  }

  const [content, setContent] = useState<Content | null>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        // Only attempt to fetch content in the browser
        if (typeof window !== 'undefined') {
          // Dynamically import Firebase to avoid SSR issues
          const firebaseModule = await import("../firebase/config");
          const firestoreModule = await import("firebase/firestore");
          
          const db = firebaseModule.db as Firestore | null;
          
          // Only try to fetch if db is available and not a mock object
          if (db && Object.keys(db).length > 0) {
            try {
              const docRef = firestoreModule.doc(db, "homepageContent", "main");
              const docSnap = await firestoreModule.getDoc(docRef);
              
              if (docSnap.exists()) {
                setContent(docSnap.data() as Content);
              } else {
                console.log("No content found in Firestore, using fallback content");
              }
            } catch (dbError) {
              console.error("Error accessing Firestore:", dbError);
            }
          } else {
            console.log("Firebase DB not available or is a mock, using fallback content");
          }
        }
      } catch (err) {
        console.error("Error importing Firebase modules:", err);
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

  // Fallback content in case Firestore data isn't available
  const fallbackContent = {
    hero: {
      title: "SnackSense",
      description: "SnackSense uses AI to analyze food ingredients and provide simple, personalized insights about what you're eating.",
      buttonText: "Analyze Your Food Now"
    },
    howItWorks: {
      title: "How SnackSense Works",
      steps: [
        { step: "Scan & Upload", desc: "Take a photo of any food product's ingredient list or upload an existing image." },
        { step: "AI Analysis", desc: "Our AI engine processes the ingredients, identifying each component and cross-referencing it with our database." },
        { step: "Get Insights", desc: "Receive a detailed breakdown of ingredients, potential allergens, and healthier alternatives." }
      ]
    },
    benefits: {
      title: "Benefits of Using SnackSense",
      items: [
        { title: "Ingredient Transparency", text: "Understand exactly what's in your food with plain language explanations." },
        { title: "Health Awareness", text: "Identify potentially harmful additives and allergens before consumption." },
        { title: "Personalized Recommendations", text: "Get alternatives based on your dietary preferences and restrictions." },
        { title: "Food Education", text: "Learn about ingredients and their impact on health over time." }
      ]
    },
    testimonials: {
      title: "What Our Users Say",
      items: [
        {
          name: "Emma Rodriguez",
          role: "Health-Conscious Parent",
          image: "/images/logo.png",
          quote: "SnackSense has completely changed how I shop for my family. Now I can quickly identify ingredients that my children are allergic to without spending hours reading labels."
        },
        {
          name: "Dr. Michael Chen",
          role: "Nutritionist",
          image: "/images/logo.png",
          quote: "I recommend SnackSense to all my patients. It's an invaluable tool for those navigating dietary restrictions or simply wanting to make more informed food choices."
        },
        {
          name: "Sarah Johnson",
          role: "Fitness Enthusiast",
          image: "/images/logo.png",
          quote: "As someone who's serious about my nutrition, this app helps me quickly identify hidden sugars and unnecessary additives in packaged foods. It's been a game-changer for my meal prep."
        }
      ]
    },
    statistics: {
      title: "SnackSense Impact",
      items: [
        { value: "500K+", label: "Food Products Analyzed" },
        { value: "50K+", label: "Active Users" },
        { value: "1M+", label: "Ingredients in Database" },
        { value: "98%", label: "Accuracy Rate" }
      ]
    },
    featuredInsights: {
      title: "Featured Insights",
      items: [
        {
          icon: "/images/logo.png",
          title: "Artificial Sweeteners: The Hidden Truth",
          text: "Our analysis of over 1,000 popular snacks revealed that 78% contain artificial sweeteners that may have long-term health implications."
        },
        {
          icon: "/images/logo.png",
          title: "Decoding Food Labels",
          text: "Many &ldquo;natural&rdquo; labeled products contain synthetic ingredients. Our latest report shows how to identify truly natural foods."
        },
        {
          icon: "/images/logo.png",
          title: "Top 10 Healthiest Snack Brands",
          text: "Based on ingredient quality and transparency, we&rsquo;ve ranked the top brands that consistently deliver nutritious options."
        }
      ]
    }
  };

  // Always use fallback content as the base, and merge with Firestore content if available
  const displayContent = {
    ...fallbackContent,
    ...(content || {})
  };

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
      
      {/* Hero Section */}
      <section className={`${styles.heroSection} ${visible ? styles.fadeIn : ""}`}>
        <h1 className={`${styles.heroTitle} ${styles.futuristicHeading}`}>{displayContent.hero.title}</h1>
        <p className={styles.heroDescription}>{displayContent.hero.description}</p>
        <Link href="/upload">
          <button className={styles.heroButton}>{displayContent.hero.buttonText}</button>
        </Link>
      </section>

      {/* How SnackSense Works Section */}
      <section className={`${styles.howItWorksSection} ${visible ? styles.fadeIn : ""}`}>
        <h2 className={styles.sectionTitle}>{displayContent.howItWorks.title}</h2>
        <div className={styles.stepsContainer}>
            {displayContent.howItWorks.steps.map((step, index) => (
              <div key={index} className={styles.stepCard}>
                <div className={styles.stepNumber}>{index + 1}</div>
                <h3 className={styles.stepTitle}>{step.step}</h3>
                <p className={styles.stepDescription}>{step.desc}</p>
              </div>
            ))}
        </div>
      </section>

      {/* Benefits of Using SnackSense Section */}
      <section className={`${styles.benefitsSection} ${visible ? styles.fadeIn : ""}`}>
        <h2 className={styles.sectionTitle}>{displayContent.benefits.title}</h2>
        <div className={styles.benefitsContainer}>
            {displayContent.benefits.items.map((benefit, index) => (
              <div key={index} className={styles.benefitCard}>
                <div className={styles.benefitIcon}></div>
                <h3 className={styles.benefitTitle}>{benefit.title}</h3>
                <p className={styles.benefitText}>{benefit.text}</p>
              </div>
            ))}
        </div>
      </section>

      {/* Statistics Section */}
      <section className={`${styles.statisticsSection} ${visible ? styles.fadeIn : ""}`}>
        <h2 className={styles.sectionTitle}>{displayContent.statistics.title}</h2>
        <div className={styles.statsContainer}>
          {displayContent.statistics.items.map((stat, index) => (
            <div key={index} className={styles.statItem}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={`${styles.testimonialsSection} ${visible ? styles.fadeIn : ""}`}>
        <h2 className={styles.sectionTitle}>{displayContent.testimonials.title}</h2>
        <div className={styles.testimonialsContainer}>
          {displayContent.testimonials.items.map((testimonial, index) => (
            <div key={index} className={styles.testimonialCard}>
              <div className={styles.testimonialHeader}>
                <div className={styles.testimonialImageContainer}>
                  <Image 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    width={60} 
                    height={60} 
                    className={styles.testimonialImage}
                  />
                </div>
                <div className={styles.testimonialInfo}>
                  <h3 className={styles.testimonialName}>{testimonial.name}</h3>
                  <p className={styles.testimonialRole}>{testimonial.role}</p>
                </div>
              </div>
              <p className={styles.testimonialQuote}>&ldquo;{testimonial.quote}&rdquo;</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Insights Section */}
      <section className={`${styles.insightsSection} ${visible ? styles.fadeIn : ""}`}>
        <h2 className={styles.sectionTitle}>{displayContent.featuredInsights.title}</h2>
        <div className={styles.insightsContainer}>
          {displayContent.featuredInsights.items.map((insight, index) => (
            <div key={index} className={styles.insightCard}>
              <div className={styles.insightIconContainer}>
                <Image 
                  src={insight.icon} 
                  alt="" 
                  width={40} 
                  height={40} 
                  className={styles.insightIcon}
                />
              </div>
              <h3 className={styles.insightTitle}>{insight.title}</h3>
              <p className={styles.insightText}>{insight.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={`${styles.ctaSection} ${visible ? styles.fadeIn : ""}`}>
        <h2 className={styles.ctaTitle}>Ready to Understand Your Food Better?</h2>
        <div className={styles.ctaButtons}>
          <Link href="/upload">
            <button className={styles.ctaButtonPrimary}>Analyze a Product</button>
          </Link>
          <Link href="/about">
            <button className={styles.ctaButtonSecondary}>Learn More</button>
          </Link>
        </div>
      </section>
    </div>
  );
}