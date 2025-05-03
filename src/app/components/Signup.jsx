"use client";

import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import '../../styles/signup.css';
import image from '../../../public/images/cropped-logo.png';
import { auth, db } from '../../lib/firebase'; // Import auth and db from centralized Firebase config

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // No need for useEffect to initialize Firebase - we're using the centralized configuration

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // Start loading

    if (!name || !email || !password) {
      setError('Name, email and password are required');
      setLoading(false);
      return;
    }

    // No need to check if auth and db are initialized - using centralized config

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      let firestoreError = false;
      
      // Store additional user data (name) in Firestore - in a separate try/catch
      try {
        await setDoc(doc(db, "users", user.uid), {
          name: name,
          email: email,
          createdAt: new Date().toISOString(),
        });
        console.log("User profile saved successfully.");
      } catch (firestoreErr) {
        console.error("Firestore error (non-blocking):", firestoreErr);
        firestoreError = true;
        // Continue with login process even if saving profile data fails
      }

      console.log("User registered successfully:", user.uid);
      setName('');
      setEmail('');
      setPassword('');
      setLoading(false);
      
      // Proceed with navigation regardless of Firestore success
      if (firestoreError) {
        // Just a warning for the console, but we still navigate the user forward
        console.warn("Note: User was created but profile data couldn't be saved. This won't affect basic functionality.");
      }
      
      router.push('/'); // Redirect to homepage
    } catch (err) {
      setLoading(false);
      console.error("Registration error:", err);
      
      // Handle specific Firebase Authentication errors
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Email is already in use.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email format.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak. It should be at least 6 characters.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection.');
          break;
        case 'auth/api-key-not-valid':
          setError('Invalid Firebase API key. Please check your environment configuration.');
          break;
        default:
          setError(`Registration error: ${err.message || 'Unknown error'}`);
      }
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
            <button type="submit" className="register-button" disabled={loading}>
              {loading ? "Signing up..." : "Sign Up"}
            </button>
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