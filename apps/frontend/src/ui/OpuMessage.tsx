import React, { useEffect } from 'react';

interface OpuMessageProps {
  message: string;
  type?: 'info' | 'error' | 'success' | 'warning';
  duration?: number; // en milisegundos
  onClose?: () => void;
}

const OpuMessage: React.FC<OpuMessageProps> = ({ message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  let bgColor = 'bg-blue-100 text-blue-800';
  if (type === 'error') bgColor = 'bg-red-100 text-red-800';
  if (type === 'success') bgColor = 'bg-green-100 text-green-800';
  if (type === 'warning') bgColor = 'bg-yellow-100 text-yellow-800';

  return (
  <div className={`fixed top-4 right-6 z-50 px-6 py-3 rounded shadow-lg ${bgColor} text-sm flex items-center gap-2`}>
      <span>{message}</span>
    </div>
  );
};

export default OpuMessage;
