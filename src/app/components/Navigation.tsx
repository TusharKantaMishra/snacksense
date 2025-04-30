"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import styles from '../../styles/navigation.module.css';

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}>
        <div className={styles.navLogo}>
          <Image 
            src="/images/logo.png" 
            alt="SnackSense" 
            width={40} 
            height={40} 
            className={styles.logoImage}
          />
          <span className={styles.logoText}>SnackSense</span>
        </div>
        
        {/* Desktop Navigation */}
        <div className={styles.navLinks}>
          <Link href="/home" className={styles.navLink}>
            Home
          </Link>
          <Link href="/upload" className={styles.navLink}>
            Analyze Food
          </Link>
          <Link href="/about" className={styles.navLink}>
            About
          </Link>
          <Link href="/contact" className={styles.navLink}>
            Contact
          </Link>
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className={styles.mobileMenuBtn} 
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </nav>
      
      {/* Mobile Menu Overlay */}
      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ''}`}>
        <button 
          className={styles.mobileCloseBtn} 
          onClick={closeMenu}
          aria-label="Close menu"
        >
          <X size={24} />
        </button>
        
        <Link href="/home" className={styles.mobileNavLink} onClick={closeMenu}>
          Home
        </Link>
        <Link href="/upload" className={styles.mobileNavLink} onClick={closeMenu}>
          Analyze Food
        </Link>
        <Link href="/about" className={styles.mobileNavLink} onClick={closeMenu}>
          About
        </Link>
        <Link href="/contact" className={styles.mobileNavLink} onClick={closeMenu}>
          Contact
        </Link>
      </div>
    </>
  );
};

export default Navigation;
