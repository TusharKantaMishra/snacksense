"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from '../../styles/about.module.css';

export default function About() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className={styles.aboutContainer}>
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

      {/* About Header */}
      <header className={`${styles.aboutHeader} ${visible ? styles.fadeIn : ""}`}>
        <h1 className={styles.aboutTitle}>About SnackSense</h1>
        <p className={styles.aboutSubtitle}>
          Revolutionizing how consumers understand food ingredients through advanced AI technology and a commitment to health-conscious eating.
        </p>
      </header>

      {/* Hero Image Section */}
      <section className={styles.imageSection}>
        <div className={styles.imageWrapper}>
          <Image 
            src="/images/food-analysis-hero.jpg" 
            alt="AI Food Analysis" 
            fill
            style={{ objectFit: 'cover' }}
          />
          <div className={styles.imageCaption}>
            Advanced AI technology analyzing food ingredients in real-time
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className={styles.contentSection}>
        <h2 className={styles.sectionTitle}>Our Mission</h2>
        <div className={styles.missionCard}>
          <p className={styles.missionText}>
            At SnackSense, we&apos;re on a mission to empower consumers with transparent, accessible information about the food they consume. In today&apos;s fast-paced world, understanding what&apos;s in your food shouldn&apos;t require a degree in chemistry or nutrition. We&apos;ve developed cutting-edge AI technology that instantly analyzes food ingredients, providing clear, actionable insights about their health implications.
          </p>
          <p className={`${styles.missionText} ${styles.missionTextSpacing}`}>
            We believe that everyone deserves to make informed choices about what they eat. Our platform bridges the gap between complex ingredient lists and practical health knowledge, making nutrition science accessible to all. By demystifying food labels, we aim to foster a healthier relationship between consumers and their food, promoting wellness through awareness and education.
          </p>
        </div>
      </section>

      {/* Our Story Section with Side-by-Side Image */}
      <section className={styles.sideBySideSection}>
        <div className={styles.textColumn}>
          <h2 className={styles.sectionTitle}>Our Story</h2>
          <div className={styles.missionCard}>
            <p className={styles.missionText}>
              SnackSense was born from a personal frustration shared by our founders. While shopping for groceries, they found themselves spending excessive time researching unfamiliar ingredients on food packages, often finding contradictory or overly technical information. They envisioned a solution that could instantly decode these complex ingredient lists and provide straightforward health assessments.
            </p>
            <p className={`${styles.missionText} ${styles.missionTextSpacing}`}>
              In 2023, this vision became reality when our team of nutritionists, data scientists, and software engineers came together to develop the SnackSense platform. We began by building a comprehensive database of food ingredients, their health implications, and scientific research. This foundation powers our AI engine, which continues to learn and improve with each analysis.
            </p>
          </div>
        </div>
        <div className={styles.imageColumn}>
          <div className={styles.imageWrapper}>
            <Image 
              src="/images/food-ingredients-database.jpg" 
              alt="Food Ingredients Database" 
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
      </section>

      {/* Our Core Values Section - Redesigned */}
      <section className={styles.valuesSection}>
        <h2 className={styles.sectionTitle}>Our Core Values</h2>
        <div className={styles.valuesContainer}>
          <div className={styles.valueRow}>
            <div className={styles.valueIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
            </div>
            <div className={styles.valueContent}>
              <h3 className={styles.valueTitle}>Scientific Integrity</h3>
              <p className={styles.valueText}>
                We base our analyses on peer-reviewed research and established nutritional science. Our commitment to accuracy means we continuously update our database as new research emerges, ensuring our users always have access to the most current and reliable information about their food.
              </p>
            </div>
          </div>

          <div className={styles.valueRow}>
            <div className={styles.valueIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
              </svg>
            </div>
            <div className={styles.valueContent}>
              <h3 className={styles.valueTitle}>Transparency</h3>
              <p className={styles.valueText}>
                We believe in complete transparency about how we analyze ingredients and what our assessments mean. Users can always access detailed explanations behind our ratings, allowing them to understand the reasoning and make informed decisions based on their personal health goals and preferences.
              </p>
            </div>
          </div>

          <div className={styles.valueRow}>
            <div className={styles.valueIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
              </svg>
            </div>
            <div className={styles.valueContent}>
              <h3 className={styles.valueTitle}>Accessibility</h3>
              <p className={styles.valueText}>
                Nutritional information should be accessible to everyone. We design our platform to be intuitive and jargon-free, making complex nutritional concepts understandable to all users regardless of their background or prior knowledge about nutrition. Our goal is to democratize access to food information.
              </p>
            </div>
          </div>

          <div className={styles.valueRow}>
            <div className={styles.valueIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                <path d="M9.669.864 8 0 6.331.864l-1.858.282-.842 1.68-1.337 1.32L2.6 6l-.306 1.854 1.337 1.32.842 1.68 1.858.282L8 12l1.669-.864 1.858-.282.842-1.68 1.337-1.32L13.4 6l.306-1.854-1.337-1.32-.842-1.68L9.669.864zm1.196 1.193.684 1.365 1.086 1.072L12.387 6l.248 1.506-1.086 1.072-.684 1.365-1.51.229L8 10.874l-1.355-.702-1.51-.229-.684-1.365-1.086-1.072L3.614 6l-.25-1.506 1.087-1.072.684-1.365 1.51-.229L8 1.126l1.356.702 1.509.229z"/>
                <path d="M4 11.794V16l4-1 4 1v-4.206l-2.018.306L8 13.126 6.018 12.1 4 11.794z"/>
              </svg>
            </div>
            <div className={styles.valueContent}>
              <h3 className={styles.valueTitle}>Innovation</h3>
              <p className={styles.valueText}>
                We continuously push the boundaries of what&apos;s possible with food analysis technology, investing in research and development to enhance our capabilities. By staying at the forefront of AI and nutritional science, we ensure our platform remains the most advanced and reliable tool for food ingredient analysis.
              </p>
            </div>
          </div>

          <div className={styles.valueRow}>
            <div className={styles.valueIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
              </svg>
            </div>
            <div className={styles.valueContent}>
              <h3 className={styles.valueTitle}>User Empowerment</h3>
              <p className={styles.valueText}>
                We don&apos;t just provide information—we empower users to make better choices. Our suggestions and alternatives help users take actionable steps toward healthier eating. By giving users the tools they need to understand their food, we enable them to take control of their nutrition and overall health.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section with Image */}
      <section className={styles.sideBySideSection}>
        <div className={styles.imageColumn}>
          <div className={styles.imageWrapper}>
            <Image 
              src="/images/health-impact.jpg" 
              alt="Health Impact" 
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
        <div className={styles.textColumn}>
          <h2 className={styles.sectionTitle}>Our Impact</h2>
          <div className={styles.missionCard}>
            <p className={styles.missionText}>
              Since our launch, SnackSense has analyzed over 5 million food products, helping more than 500,000 users make informed dietary choices. Our community reports a 78% increase in confidence when selecting packaged foods and a 45% reduction in consumption of artificial additives and preservatives.
            </p>
            <p className={`${styles.missionText} ${styles.missionTextSpacing}`}>
              Beyond individual users, we&apos;re proud to partner with educational institutions, healthcare providers, and food manufacturers who use our technology to promote healthier food options. Through these collaborations, we&apos;re helping shape a future where transparency in food ingredients becomes the industry standard.
            </p>
            <p className={`${styles.missionText} ${styles.missionTextSpacing}`}>
              As we continue to grow, our commitment to improving global nutrition literacy remains unwavering. Every scan, every analysis, and every recommendation brings us one step closer to our vision of a world where everyone can easily understand what&apos;s in their food and how it affects their health.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}