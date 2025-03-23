"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import "../../styles/footer.css"; // Import global styles

const Footer = () => {
  // Use state to handle client-side rendering of dynamic content
  const [mounted, setMounted] = useState(false);
  
  // Only render dynamic content after component has mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="footer">
      <div className="footer-gradient"></div>
      
      <div className="footer-content">
        <div className="footer-logo">
          <div className="logo-container">
            <Image 
              src="/images/cropped-logo.png" 
              alt="SnackSense Logo" 
              width={50} 
              height={50} 
              className="footer-logo-img"
            />
            <h2 className="logo-text">
              Snack<span>Sense</span>
            </h2>
          </div>
        </div>
        
        <div className="footer-links">
          <div className="footer-section">
            <h3>EXPLORE</h3>
            <ul>
              <li><Link href="/dashboard">Dashboard</Link></li>
              <li><Link href="/upload">Analyze Food</Link></li>
              <li><Link href="/history">Your History</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>ABOUT</h3>
            <ul>
              <li><Link href="/about">Our Story</Link></li>
              <li><Link href="/how-it-works">How It Works</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>FOLLOW US</h3>
            <div className="social-icons">
              <Link href="https://facebook.com" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </Link>
              <Link href="https://twitter.com" aria-label="Twitter">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </Link>
              <Link href="https://instagram.com" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </Link>
              <Link href="https://linkedin.com" aria-label="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {mounted ? new Date().getFullYear() : '2025'} SnackSense. All rights reserved.</p>
        <div className="footer-bottom-links">
          <Link href="/privacy-policy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
