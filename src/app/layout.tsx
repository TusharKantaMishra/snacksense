"use client";

import { useEffect } from "react";
import "../styles/globals.css"; // Import global styles
import Navbar from "../app/components/Navbar"; // Import Navbar
import Footer from "../app/components/Footer"; // Import Footer

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const cursor = document.querySelector(".cursor-glow") as HTMLElement;
      if (cursor) {
        cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>  
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

        {/* 🏆 Navbar */}
        <Navbar />

        {/* 🌟 Page Content */}
        <div className="page-container">{children}</div>

        {/* ⚡ Footer */}
        <Footer />
      </body>
    </html>
    </>
  );
}
