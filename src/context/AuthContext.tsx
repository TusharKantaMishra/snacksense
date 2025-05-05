"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  getIdToken 
} from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '../lib/firebase';
import Cookies from 'js-cookie';

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  setTokenCookie: (forceRefresh?: boolean) => Promise<string | null>;
  clearTokenCookie: () => void;
};

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  setTokenCookie: async () => null,
  clearTokenCookie: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Store Firebase ID token in cookie
  const setTokenCookie = async (forceRefresh = false) => {
    if (currentUser) {
      try {
        const token = await getIdToken(currentUser, forceRefresh);
        // Set cookie with token, expires in 7 days
        Cookies.set('firebase-token', token, { 
          expires: 7, 
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        console.log('Auth token cookie successfully set');
        return token;
      } catch (error) {
        console.error('Error setting auth token cookie:', error);
        return null;
      }
    }
    return null;
  };

  // Clear auth token cookie
  const clearTokenCookie = () => {
    Cookies.remove('firebase-token', { path: '/' });
  };

  useEffect(() => {
    // Set up Firebase auth state observer
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // User is signed in, set the token cookie
        await setTokenCookie();
        console.log('Auth state changed: User is signed in, token set');
      } else {
        // User is signed out, remove the token cookie
        clearTokenCookie();
        console.log('Auth state changed: User is signed out, token cleared');
      }
      
      setLoading(false);
    }, (error) => {
      // Handle auth observer error
      console.error('Auth state observer error:', error);
      // On error, clear the token to be safe
      clearTokenCookie();
      setLoading(false);
    });

    // Clean up the observer when component unmounts
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    setTokenCookie,
    clearTokenCookie
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
