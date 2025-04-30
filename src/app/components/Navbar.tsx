"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import "../../styles/navbar.css";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav className="navbar">
        {/* Logo & Site Name */}
        <Link href="/">
          <Image 
            src="/images/logo.png" 
            alt="SnackSense Logo" 
            className="site-logo" 
            width={50} 
            height={50} 
            priority={true} 
          />
        </Link>

        {/* Desktop Links */}
        <ul className="nav-links">
          <li><Link href="/home">Home</Link></li>
          <li><Link href="/upload">Upload</Link></li>
          <li><Link href="/about">About</Link></li>
          <li><Link href="/contact">Contact</Link></li>
          <li><Link href={"/"} className="logout-link">Logout</Link></li>
        </ul>

        {/* Mobile Menu Button */}
        <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
          <div className={`bar ${isOpen ? "open" : ""}`}></div>
          <div className={`bar ${isOpen ? "open" : ""}`}></div>
          <div className={`bar ${isOpen ? "open" : ""}`}></div>
        </div>

        {/* Mobile Dropdown Menu */}
        <ul className={`mobile-menu ${isOpen ? "active" : ""}`}>
          <li><Link href="/home" onClick={() => setIsOpen(false)}>Home</Link></li>
          <li><Link href="/upload" onClick={() => setIsOpen(false)}>Upload</Link></li>
          <li><Link href="/about" onClick={() => setIsOpen(false)}>About</Link></li>
          <li><Link href="/contact" onClick={() => setIsOpen(false)}>Contact</Link></li>
          <li><Link href={"/"} onClick={() => setIsOpen(false)}>Logout</Link></li>
        </ul>
      </nav>
    </>
  );
}