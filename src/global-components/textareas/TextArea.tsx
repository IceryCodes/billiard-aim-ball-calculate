import { ChangeEventHandler, InputHTMLAttributes, ReactNode, forwardRef } from 'react';

interface TextAreaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  placeholder?: string;
  element?: ReactNode;
  className?: string;
  disabled?: boolean;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  required?: boolean;
}

const textareaClassName: string = 'border rounded px-4 py-2 w-full bg-backgroundLight text-foreground h-40';

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ placeholder, element, className = '', onChange, disabled = false, required = false, ...restProps }, ref) => {
    return (
      <textarea
        ref={ref}
        placeholder={placeholder}
        className={element ? className : `${textareaClassName} ${className}`}
        onChange={onChange}
        disabled={disabled}
        required={required}
        {...restProps}
      />
    );
  }
);

TextArea.displayName = 'TextArea';
