'use client';

import { ButtonHTMLAttributes, MouseEventHandler, ReactNode, useMemo } from 'react';

export enum ButtonStyleType {
  Active = 0,
  Disabled = 1,
  Warning = 2,
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  element?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
  buttonStyle?: ButtonStyleType;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export const defaultButtonStyle = 'px-2 py-1 rounded-lg text-center';

export const Button = ({
  text,
  element,
  type = 'button',
  className = '',
  onClick,
  disabled = false,
  buttonStyle = disabled ? ButtonStyleType.Disabled : ButtonStyleType.Active,
  ...restProps
}: ButtonProps) => {
  const buttonClassName = useMemo((): string => {
    switch (buttonStyle) {
      case ButtonStyleType.Active:
        return 'bg-link hover:scale-105 text-background';
      case ButtonStyleType.Disabled:
        return 'bg-background hover:scale-105 text-foreground';
      case ButtonStyleType.Warning:
        return 'bg-red-500 hover:scale-105 text-white';
      default:
        return '';
    }
  }, [buttonStyle]);

  return (
    <button
      type={type ?? 'button'}
      className={element ? className : `${buttonClassName} ${defaultButtonStyle} transition-all duration-300 ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...restProps}
    >
      {element ?? text}
    </button>
  );
};
