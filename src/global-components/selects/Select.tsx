import { InputHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  defaultValue: string;
  options: (string | number)[];
  className?: string;
}

const selectClassName = 'border rounded px-4 py-2 w-full bg-backgroundLight text-foreground';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ defaultValue, options, className = '', ...restProps }, ref) => {
    return (
      <select {...restProps} ref={ref} className={`${selectClassName} ${className}`}>
        <option value="">{defaultValue}</option>
        {options.map((item: string | number) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = 'Select';
