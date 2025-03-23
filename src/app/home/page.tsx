"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "../firebase/config"; // Ensure path is correct
import { doc, getDoc } from "firebase/firestore";
import styles from "../../styles/home.module.css";
import Image from "next/image";

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

  // Fallback content in case Firestore data isn't available
  const fallbackContent = {
    hero: {
      title: "Discover What's Really In Your Food",
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

  // Merge Firestore content with fallback data, ensuring new sections exist
  const displayContent = {
    ...fallbackContent,
    ...content,
    // Ensure these new sections exist even if not in Firestore data
    statistics: content?.statistics || fallbackContent.statistics,
    testimonials: content?.testimonials || fallbackContent.testimonials,
    featuredInsights: content?.featuredInsights || fallbackContent.featuredInsights
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

      {/* How It Works Section */}
      <section className={styles.howItWorksSection}>
        <h2 className={`${styles.sectionTitle} ${styles.futuristicHeading}`}>{displayContent.howItWorks.title}</h2>
        <div className={styles.gridContainer}>
          {displayContent.howItWorks.steps.map((item, index) => (
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

      {/* Benefits Section */}
      <section className={styles.benefitsSection}>
        <h2 className={`${styles.sectionTitle} ${styles.futuristicHeading}`}>{displayContent.benefits.title}</h2>
        <div className={styles.gridContainer}>
          {displayContent.benefits.items.map((item, index) => (
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
      
      {/* Statistics Section */}
      <section className={`${styles.statisticsSection} ${visible ? styles.fadeIn : ""}`}>
        <h2 className={`${styles.sectionTitle} ${styles.futuristicHeading}`}>SnackSense Impact</h2>
        <div className={styles.statsContainer}>
          {fallbackContent.statistics.items.map((stat, index) => (
            <div key={index} className={styles.statItem}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className={styles.testimonialsSection}>
        <h2 className={`${styles.sectionTitle} ${styles.futuristicHeading}`}>What Our Users Say</h2>
        <div className={styles.testimonialContainer}>
          {fallbackContent.testimonials.items.map((testimonial, index) => (
            <div key={index} className={`${styles.testimonialCard} ${styles[`delay${index}`]}`}>
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
                <div className={styles.testimonialUser}>
                  <h4 className={styles.testimonialName}>{testimonial.name}</h4>
                  <p className={styles.testimonialRole}>{testimonial.role}</p>
                </div>
              </div>
              <div className={styles.testimonialQuote}>
                <svg className={styles.quoteIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 11H6C3.79086 11 2 9.20914 2 7V6C2 3.79086 3.79086 2 6 2H7C9.20914 2 11 3.79086 11 6V19C11 20.6569 9.65685 22 8 22H7C5.34315 22 4 20.6569 4 19V18" stroke="#41B8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 11H18C15.7909 11 14 9.20914 14 7V6C14 3.79086 15.7909 2 18 2H19C21.2091 2 23 3.79086 23 6V19C23 20.6569 21.6569 22 20 22H19C17.3431 22 16 20.6569 16 19V18" stroke="#41B8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className={styles.testimonialText}>{testimonial.quote}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Featured Insights Section */}
      <section className={styles.featuredInsightsSection}>
        <h2 className={`${styles.sectionTitle} ${styles.futuristicHeading}`}>Featured Insights</h2>
        <div className={styles.insightsContainer}>
          <div className={`${styles.insightCard} ${styles.delay0}`}>
            <div className={styles.insightIconContainer}>
              <svg className={styles.insightIcon} width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#41B8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 9H9.01" stroke="#41B8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 9H15.01" stroke="#41B8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 14H16" stroke="#41B8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className={styles.insightTitle}>Artificial Sweeteners: The Hidden Truth</h3>
            <p className={styles.insightText}>
              Our analysis of over 1,000 popular snacks revealed that 78% contain artificial sweeteners 
              that may have long-term health implications.
            </p>
            <Link href="/insights" className={styles.insightLink}>
              Read More
            </Link>
          </div>
          
          <div className={`${styles.insightCard} ${styles.delay1}`}>
            <div className={styles.insightIconContainer}>
              <svg className={styles.insightIcon} width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#41B8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className={styles.insightTitle}>Decoding Food Labels</h3>
            <p className={styles.insightText}>
              Many &ldquo;natural&rdquo; labeled products contain synthetic ingredients. Our latest report shows 
              how to identify truly natural foods.
            </p>
            <Link href="/insights" className={styles.insightLink}>
              Read More
            </Link>
          </div>
          
          <div className={`${styles.insightCard} ${styles.delay2}`}>
            <div className={styles.insightIconContainer}>
              <svg className={styles.insightIcon} width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H21M3 12H21M3 18H21" stroke="#41B8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className={styles.insightTitle}>Top 10 Healthiest Snack Brands</h3>
            <p className={styles.insightText}>
              Based on ingredient quality and transparency, we&rsquo;ve ranked the top brands that 
              consistently deliver nutritious options.
            </p>
            <Link href="/insights" className={styles.insightLink}>
              Read More
            </Link>
          </div>
        </div>
      </section>
      
      {/* Call to Action Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGlow}></div>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Make Smarter Food Choices?</h2>
          <p className={styles.ctaText}>
            Join thousands of users who have transformed their relationship with food. 
            SnackSense gives you the knowledge you need to make informed decisions about what you eat.
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/upload">
              <button className={styles.primaryCtaButton}>Analyze Your First Product</button>
            </Link>
            <Link href="/about">
              <button className={styles.secondaryCtaButton}>Learn More About Us</button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}