import { InputHTMLAttributes, forwardRef } from 'react';

// 定義選項的類型
type SimpleOption = string | number;
type ComplexOption = { value: string | number; label: string };

interface SelectProps<T extends SimpleOption | ComplexOption> extends InputHTMLAttributes<HTMLSelectElement> {
  defaultValue: string;
  options: T[];
  className?: string;
}

const selectClassName = 'border rounded px-4 py-2 w-full bg-backgroundLight text-foreground';

// 判斷是否為複雜選項
function isComplexOption(option: SimpleOption | ComplexOption): option is ComplexOption {
  return typeof option === 'object' && option !== null && 'value' in option && 'label' in option;
}

// 泛型版本的 Select 組件
export const Select = forwardRef<HTMLSelectElement, SelectProps<SimpleOption | ComplexOption>>(
  ({ defaultValue, options, className = '', ...restProps }, ref) => {
    return (
      <select {...restProps} ref={ref} className={`${selectClassName} ${className}`}>
        <option value="">{defaultValue}</option>
        {options.map((item) => {
          if (isComplexOption(item)) {
            // 處理 { value, label } 格式的選項
            return (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            );
          } else {
            // 處理 string | number 格式的選項
            return (
              <option key={item} value={item}>
                {item}
              </option>
            );
          }
        })}
      </select>
    );
  }
);

Select.displayName = 'Select';
