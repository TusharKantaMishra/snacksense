"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Linkedin, Github } from 'lucide-react';
import Image from 'next/image';
import '../../styles/contact.css';

export default function Contact() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className="contact-container">
      {/* Animated background particles - similar to homepage */}
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      
      {/* Header */}
      <header className={`contact-header ${visible ? 'fade-in' : ''}`}>
        <h1 className="contact-title">Contact Us</h1>
        <p className="contact-subtitle">
          Have questions about SnackSense? Our team is here to help! Reach out to us for support, 
          feedback, or partnership opportunities.
        </p>
      </header>

      <div className="contact-grid">
        {/* Contact Card 1 */}
        <div className={`contact-card ${visible ? 'slide-in-left' : ''}`}>
          <div className="contact-image-container">
            <Image 
              src="/images/logo.png" 
              alt="Dr. Sarah Chen" 
              width={120}
              height={120}
              className="contact-image"
            />
          </div>
          <h2 className="contact-name">Dr. Sarah Chen</h2>
          <p className="contact-position">Chief Nutritional Officer</p>
          <div className="contact-divider"></div>
          <ul className="contact-details">
            <li>
              <Mail className="contact-icon" size={18} />
              <span>sarah.chen@snacksense.com</span>
            </li>
            <li>
              <Phone className="contact-icon" size={18} />
              <span>+1 (555) 123-4567</span>
            </li>
            <li>
              <MapPin className="contact-icon" size={18} />
              <span>San Francisco, CA</span>
            </li>
            <li>
              <Linkedin className="contact-icon" size={18} />
              <span>linkedin.com/in/sarahchen</span>
            </li>
          </ul>
          <p className="contact-bio">
            Dr. Chen leads our nutrition research team and is an expert in food science with 
            over 15 years of experience in the field of nutritional analysis and health impact assessment.
          </p>
        </div>

        {/* Contact Card 2 */}
        <div className={`contact-card ${visible ? 'slide-in-right' : ''}`}>
          <div className="contact-image-container">
            <Image 
              src="/images/cropped-logo.png" 
              alt="Michael Rodriguez" 
              width={120}
              height={120}
              className="contact-image"
            />
          </div>
          <h2 className="contact-name">Michael Rodriguez</h2>
          <p className="contact-position">Technical Support Lead</p>
          <div className="contact-divider"></div>
          <ul className="contact-details">
            <li>
              <Mail className="contact-icon" size={18} />
              <span>michael.r@snacksense.com</span>
            </li>
            <li>
              <Phone className="contact-icon" size={18} />
              <span>+1 (555) 987-6543</span>
            </li>
            <li>
              <MapPin className="contact-icon" size={18} />
              <span>Austin, TX</span>
            </li>
            <li>
              <Github className="contact-icon" size={18} />
              <span>github.com/michaelr-tech</span>
            </li>
          </ul>
          <p className="contact-bio">
            Michael oversees our customer support team and technical operations. With a 
            background in AI and machine learning, he ensures all your technical questions 
            about SnackSense are answered promptly and effectively.
          </p>
        </div>
      </div>

      {/* Contact Form */}
      <div className={`contact-form-container ${visible ? 'fade-in-up' : ''}`}>
        <h2 className="form-title">Send Us a Message</h2>
        <form className="contact-form">
          <div className="form-group">
            <input type="text" placeholder="Your Name" required />
          </div>
          <div className="form-group">
            <input type="email" placeholder="Your Email" required />
          </div>
          <div className="form-group">
            <input type="text" placeholder="Subject" required />
          </div>
          <div className="form-group">
            <textarea placeholder="Your Message" rows={5} required></textarea>
          </div>
          <button type="submit" className="submit-button">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}