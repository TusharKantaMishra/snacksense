"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { User as UserIcon, LogOut } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import "../../styles/navbar.css";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userName, setUserName] = useState('User');
  const router = useRouter();
  const { clearTokenCookie, currentUser } = useAuth();
  
  // Fetch user name from Firestore when component mounts
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        if (!currentUser?.uid) return;
        
        console.log("Fetching user data for:", currentUser.uid);
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("User data from Firestore:", userData);
          if (userData.name) {
            console.log("Setting user name from Firestore:", userData.name);
            setUserName(userData.name);
          } else if (currentUser.displayName) {
            // Fallback to Firebase auth displayName if no name in Firestore
            console.log("Setting user name from displayName:", currentUser.displayName);
            setUserName(currentUser.displayName);
          } else if (currentUser.email) {
            // Or just use email without the domain part
            const emailName = currentUser.email.split('@')[0];
            console.log("Setting user name from email:", emailName);
            setUserName(emailName);
          }
        } else {
          console.log("No user document found, using fallbacks");
          // Document doesn't exist, use fallbacks
          if (currentUser.displayName) {
            setUserName(currentUser.displayName);
          } else if (currentUser.email) {
            setUserName(currentUser.email.split('@')[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to Firebase auth info if Firestore fails
        if (currentUser?.displayName) {
          setUserName(currentUser.displayName);
        } else if (currentUser?.email) {
          setUserName(currentUser.email.split('@')[0]);
        }
      }
    };
    
    if (currentUser) {
      fetchUserName();
    }
  }, [currentUser]);
  
  // Handle user logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear auth token cookie
      clearTokenCookie();
      
      // Redirect to the login page
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-container') && isProfileOpen) {
        setIsProfileOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

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
        </ul>
        
        {/* Profile Section - Now separated from nav-links */}
        <div className="profile-container">
          <div 
            className="profile-icon-wrapper" 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="profile-icon">
              <UserIcon size={20} />
            </div>
            <span className="profile-name">{userName}</span>
          </div>
          
          {isProfileOpen && (
            <div className="profile-dropdown">
              <button 
                onClick={handleLogout} 
                className="signout-button" 
                disabled={isLoggingOut}
              >
                <LogOut size={16} />
                <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
              </button>
            </div>
          )}
        </div>

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
          <li className="mobile-profile-section">
            <div className="mobile-profile-info">
              <div className="profile-icon">
                <UserIcon size={20} />
              </div>
              <span className="profile-name">{userName}</span>
            </div>
            <button 
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }} 
              className="mobile-signout-button" 
              disabled={isLoggingOut}
            >
              <LogOut size={16} />
              <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}