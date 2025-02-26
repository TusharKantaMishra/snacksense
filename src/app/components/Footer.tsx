"use client";

import React from "react";
import "../../styles/footer.css"; // Import global styles

const Footer = () => {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} SnackSense. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
