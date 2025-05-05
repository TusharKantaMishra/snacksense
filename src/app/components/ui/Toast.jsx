"use client";

import React, { useState, useEffect } from 'react';
import '../../../styles/toast.css';

/**
 * Toast notification component
 * @param {Object} props Component props
 * @param {string} props.message Message to display in toast
 * @param {string} props.type Type of toast (success, error, warning, info)
 * @param {number} props.duration Duration in milliseconds to show the toast
 * @param {boolean} props.show Whether to show the toast
 * @param {Function} props.onClose Callback when toast is closed
 */
const Toast = ({ 
  message, 
  type = 'info', 
  duration = 5000, 
  show, 
  onClose 
}) => {
  const [visible, setVisible] = useState(show);
  
  useEffect(() => {
    setVisible(show);
    
    if (show && duration) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
    
    return () => {};
  }, [show, duration, onClose]);
  
  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };
  
  if (!visible) return null;
  
  return (
    <div className={`toast-container toast-${type}`}>
      <div className="toast-content">
        <span className="toast-message">{message}</span>
        <button className="toast-close" onClick={handleClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
