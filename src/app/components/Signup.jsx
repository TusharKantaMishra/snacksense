"use client";

import React, { useState } from 'react';
import { User, Lock, Cpu } from 'lucide-react';
import Link from "next/link";
import { useRouter } from "next/navigation"; // Use useRouter from Next.js
import { auth } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore'; // For Firestore
import '../../styles/signup.css'; // Importing external CSS

function Signup() {
  const [name, setName] = useState(''); // New state for name
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const db = getFirestore(); // Initialize Firestore

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');


    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

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
      setConfirmPassword('');
      router.push('/'); // Redirect to homepage (or '/home' if preferred)
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message); // Set the Firebase error message
    }
  };

  return (
    <div className="register-container">
      {/* Left Section */}
      <div className="register-left">
        <h1 className="title">SNACKSENSE</h1>
        <p className="subtitle">Packed Food Analysis</p>
        <Cpu className="cpu-icon" />
      </div>

      {/* Right Section - Registration Form */}
      <div className="register-right">
        <div className="register-form-container">
          <h2 className="form-title">CREATE ACCOUNT</h2>
          {error && <p className="error-text">{error}</p>}
          <form onSubmit={handleSignup} className="register-form"> {/* Changed to handleSignup */}
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