"use client";

import React, { useState, useEffect } from 'react';
import { User, Lock } from 'lucide-react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import '../../styles/signup.css';
import image from '../../../public/images/cropped-logo.png';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  
  // Only load Firebase on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!isClient) {
      setError('Authentication is only available in the browser');
      return;
    }

    try {
      // Dynamically import Firebase modules to avoid SSR issues
      const { auth } = await import('../firebase/config');
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { getFirestore, doc, setDoc } = await import('firebase/firestore');
      
      // Check if auth is available (not a mock)
      if (!auth || Object.keys(auth).length === 0) {
        setError('Authentication service is not available');
        return;
      }

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get Firestore instance
      const db = getFirestore();
      
      // Store additional user data (name) in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        createdAt: new Date().toISOString(),
      });

      console.log("User registered successfully:", user.uid);
      setName('');
      setEmail('');
      setPassword('');
      router.push('/'); // Redirect to homepage
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || 'An error occurred during registration');
    }
  };

  return (
    <div className="register-container">
      {/* Animated background particles */}
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      
      {/* Left Section */}
      <div className="register-left">
        <Image src={image} className='initial-page-logo' alt="Snacksense Logo" />
        <h1 className="title">SNACKSENSE</h1>
        <p className="subtitle">Packed Food Analysis</p>
      </div>

      {/* Right Section - Registration Form */}
      <div className="register-right">
        <div className="register-form-container">
          <h2 className="form-title">CREATE ACCOUNT</h2>
          {error && <p className="error-text">{error}</p>}
          <form onSubmit={handleSignup} className="register-form">
            <div className="input-group">
              <User className="input-icon" size={18} />
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <User className="input-icon" size={18} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="register-button">Sign Up</button>
          </form>
          <div className="redirect-text">
            <Link href="/" className="login-link">Sign In Instead</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;