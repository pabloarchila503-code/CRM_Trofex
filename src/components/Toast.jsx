import React, { useEffect, useState } from 'react';

export default function Toast({ message, type, onClose }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Small delay to trigger CSS transition
    const timer1 = setTimeout(() => setActive(true), 10);
    const timer2 = setTimeout(() => {
      setActive(false);
      setTimeout(onClose, 400); // Wait for transition out before calling onClose
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onClose]);

  return (
    <div className={`toast toast-${type} ${active ? 'show' : ''}`}>
      <i className={`fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
      {message}
    </div>
  );
}
