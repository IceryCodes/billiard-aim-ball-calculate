'use client';

import { ReactNode, useEffect } from 'react';

import { Button } from './buttons/Button';

export enum ToastStyleType {
  Normal = 'bg-backgroundLight',
  Warning = 'bg-red-400',
}

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  toastStyle?: ToastStyleType;
}

const Toast = ({ message, onClose, duration = 5000, toastStyle = ToastStyleType.Normal }: ToastProps): ReactNode => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`${toastStyle} z-50 fixed w-80 p-4 rounded shadow-lg transition-all duration-duration ease-in-out`}
      style={{
        bottom: '20px',
        right: message ? '20px' : '-384px',
        opacity: message ? 1 : 0,
      }}
    >
      <span
        className={`${toastStyle === ToastStyleType.Warning ? 'text-white' : 'text-foreground'} mr-5`}
        style={{ marginRight: '20px' }}
      >
        {message}
      </span>
      <Button
        element={<span className="text-lg text-foreground hover:text-link transition">&times;</span>}
        onClick={onClose}
        className="absolute top-1 right-4"
        style={{
          position: 'absolute',
          top: '5px',
          right: '1rem',
        }}
      />
    </div>
  );
};

export default Toast;
