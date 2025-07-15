import { ChangeEventHandler, forwardRef, InputHTMLAttributes, ReactNode, useMemo } from 'react';

export enum InputStyleType {
  Text = 'text',
  Checkbox = 'checkbox',
  Email = 'email',
  Password = 'password',
  Number = 'number',
  Tel = 'tel',
  Url = 'url',
  Search = 'search',
  Time = 'time',
  DatetimeLocal = 'datetime-local',
}

export enum AutoCompleteType {
  GivenName = 'given-name',
  FamilyName = 'family-name',
  Email = 'email',
  CurrentPassword = 'current-password',
  CcNumber = 'cc-number',
  CcSecurity = 'cc-security',
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  element?: ReactNode;
  type?: InputStyleType;
  className?: string;
  disabled?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  value?: string | number;
  checked?: boolean;
  autoComplete?: AutoCompleteType;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      placeholder,
      element,
      type = InputStyleType.Text,
      className = '',
      onChange,
      disabled = false,
      checked = false,
      value = undefined,
      autoComplete = undefined,
      required = false,
      ...restProps
    }: InputProps,
    ref
  ) => {
    const inputClassName = useMemo((): string => {
      switch (type) {
        case InputStyleType.Checkbox:
          return 'mr-2 h-4 w-4 accent-link';
        default:
          return 'border rounded px-4 py-2 w-full bg-backgroundLight text-foreground';
      }
    }, [type]);

    return (
      <input
        ref={ref}
        placeholder={placeholder}
        type={type ?? InputStyleType.Text}
        value={value}
        checked={checked}
        className={element ? className : `${inputClassName} ${className}`}
        onChange={onChange}
        disabled={disabled}
        autoComplete={autoComplete}
        required={required}
        {...restProps}
      />
    );
  }
);

Input.displayName = 'Input';
