'use client';

import { ReactNode } from 'react';

import { Button } from './buttons/Button';

export enum PopupStyleType {
  Normal = 'bg-blue-400',
  Warning = 'bg-red-400',
}

interface PopupProps {
  title: string;
  children: ReactNode;
  display: boolean;
  noBlackBg?: boolean;
  onClose: () => void;
}

const Popup = ({ title, children, display, noBlackBg = false, onClose }: PopupProps): ReactNode => {
  return (
    <>
      <div
        className={`fixed inset-0 flex items-center justify-center bg-opacity-40 transition-all duration-300 ${display ? 'opacity-100' : 'opacity-0'} ${display ? 'z-20' : '-z-10'} ${display && !noBlackBg ? 'bg-black' : 'bg-transparent'}`}
        onClick={onClose}
      >
        <div
          className={`fixed bg-backgroundLight rounded shadow-lg p-4 m-4 flex flex-col gap-4 max-w-6xl max-h-content overflow-y-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && <label className="text-2xl font-bold">{title}</label>}
          {children}
          <Button
            element={<span className="text-2xl hover:text-link transition">&times;</span>}
            onClick={onClose}
            className="absolute top-2 right-4"
          />
        </div>
      </div>
    </>
  );
};

export default Popup;
