"use client";

import { usePathname } from "next/navigation"; // Import usePathname hook
import "../styles/globals.css"; // Import global styles
import Navbar from "./components/Navbar"; // Import Navbar
import Footer from "./components/Footer"; // Import Footer
import { AuthProvider } from "./providers"; // Import our AuthProvider

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); // Get the current route

  // Pages where Navbar & Footer should be hidden
  const isAuthPage = pathname === "/" || pathname === "/signup";

  return (
    <html lang="en">
      <body>
        {/* 🌌 Animated Background */}
        <div className="animated-bg"></div>
        <div className="particle-container">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>

        {/* 🌀 Cursor Glow Effect */}
        <div className="cursor-glow"></div>

        {/* Wrap the entire application with our AuthProvider */}
        <AuthProvider>
          {/* 🏆 Navbar (Only hide on login/signup pages) */}
          {!isAuthPage && <Navbar />}

          {/* 🌟 Page Content */}
          <div className="page-container">
            {children}
          </div>

          {/* ⚡ Footer (Only hide on login/signup pages) */}
          {!isAuthPage && <Footer />}
        </AuthProvider>
      </body>
    </html>
  );
}
