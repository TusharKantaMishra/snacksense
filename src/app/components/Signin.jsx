"use client";

import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from 'firebase/auth';
import Image from "next/image";
import '../../styles/signin.css'; // Importing external CSS
import image from '../../../public/images/cropped-logo.png'; // Importing image
import { auth } from '../../lib/firebase'; // Import auth from centralized Firebase config

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // No need for useEffect to initialize Firebase - we're using the centralized configuration

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // Start loading

    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    // No need to check if auth is initialized or validate Firebase config
    // since we're using the centralized Firebase auth service

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in successfully:", userCredential.user.uid);
      setEmail('');
      setPassword('');
      setLoading(false);
      router.push('/home'); // Redirect to dashboard after successful login
    } catch (err) {
      setLoading(false);
      console.error("Sign-in error:", err);
      // Handle specific Firebase Authentication errors
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No user found with this email.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email format.');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Try again later.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection.');
          break;
        case 'auth/api-key-not-valid':
          setError('Invalid Firebase API key. Please check your environment configuration.');
          break;
        default:
          setError(`Authentication error: ${err.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="signin-container">
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
      
      <div className="signin-left">
        <Image src={image} alt="SnackSense Logo" className="initial-page-logo" />
        <h1 className="title">SNACKSENSE</h1>
        <p className="subtitle">Packed Food Analysis</p>
      </div>

      <div className="signin-right">
        <div className="signin-form-container">
          <h2 className="form-title">SIGN IN</h2>
          {error && <p className="error-text">{error}</p>}
          <form onSubmit={handleSignIn} className="signin-form">
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
            <button type="submit" className="signin-button" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div className="redirect-text">
            <Link href="/signup" className="register-link">Sign Up</Link> {/* Changed to href */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;