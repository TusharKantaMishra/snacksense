"use client";

import React, { useState, useEffect } from 'react';
import { User, Lock } from 'lucide-react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';
import Image from 'next/image';
import '../../styles/signup.css';
import image from '../../../public/images/cropped-logo.png';
import firebaseConfig from '../firebase/configValues';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const router = useRouter();
  
  // Initialize Firebase when component mounts
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Only initialize if not already initialized
        let app;
        if (!getApps().length) {
          app = initializeApp(firebaseConfig);
        } else {
          app = getApps()[0];
        }
        
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);
        setAuth(authInstance);
        setDb(dbInstance);
        console.log('Firebase Auth and Firestore initialized in Signup component');
      } catch (error) {
        console.error('Error initializing Firebase in Signup:', error);
        setError('Failed to initialize authentication. Please try again later.');
      }
    };

    // Only run in browser
    if (typeof window !== 'undefined') {
      initializeFirebase();
    }
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !email || !password) {
      setError('Name, email and password are required');
      setLoading(false);
      return;
    }

    // Check if auth and db objects are initialized
    if (!auth || !db) {
      setLoading(false);
      setError('Authentication service is initializing. Please try again in a moment.');
      console.log('Auth or DB object not yet initialized');
      return;
    }

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store additional user data (name) in Firestore
      // Use the db instance we already have in state
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