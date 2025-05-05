"use client";

import { AuthProvider as FirebaseAuthProvider } from "../context/AuthContext";

export const AuthProvider = ({ children }) => {
  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
};