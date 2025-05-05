"use client";

import React, { useState, useEffect } from 'react';
import { User, Lock } from 'lucide-react';
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from 'firebase/auth';
import Image from "next/image";
import '../../styles/signin.css'; // Importing external CSS
import image from '../../../public/images/cropped-logo.png'; // Importing image
import { auth } from '../../lib/firebase'; // Import auth from centralized Firebase config
import { useAuth } from '../../context/AuthContext'; // Import auth context
import Toast from "./ui/Toast"; // Import Toast component

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokenCookie } = useAuth();
  
  // Get redirect path if available
  const redirectPath = searchParams.get('redirect');
  // Get error information from URL if available
  const urlError = searchParams.get('error');
  const urlMessage = searchParams.get('message');

  // Set error from URL parameters when component mounts
  useEffect(() => {
    if (urlError && urlMessage) {
      setToastMessage(urlMessage);
      setToastType('error');
      setShowToast(true);
    }
  }, [urlError, urlMessage]);

  const showError = (message, type = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setError(message); // Keep the inline error message for accessibility
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setShowToast(false);
    setLoading(true); // Start loading

    if (!email || !password) {
      showError('Email and password are required');
      setLoading(false);
      return;
    }

    try {
      // Sign in with Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in successfully:", userCredential.user.uid);
      
      // Set authentication token cookie via our AuthContext
      await setTokenCookie(true); // Force refresh token
      
      // Reset form state
      setEmail('');
      setPassword('');
      
      // The middleware will automatically handle the redirection
      // Just navigate to the home page, and the middleware will ensure
      // the user stays there if authenticated
      router.push('/home');
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error("Sign-in error:", err);
      // Handle specific Firebase Authentication errors
      switch (err.code) {
        case 'auth/user-not-found':
          showError('No user found with this email.');
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          showError('Incorrect email or password.');
          break;
        case 'auth/invalid-email':
          showError('Invalid email format.');
          break;
        case 'auth/too-many-requests':
          showError('Too many attempts. Try again later.');
          break;
        case 'auth/network-request-failed':
          showError('Network error. Please check your connection.');
          break;
        case 'auth/api-key-not-valid':
          showError('Invalid Firebase API key. Please check your environment configuration.');
          break;
        case 'auth/user-disabled':
          showError('This account has been disabled. Please contact support.');
          break;
        default:
          showError(`Authentication error: ${err.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="signin-container">
      {/* Toast notification for errors */}
      <Toast
        message={toastMessage}
        type={toastType}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
      
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