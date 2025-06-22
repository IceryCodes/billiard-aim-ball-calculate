import { ReactNode } from 'react';

import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

import FieldErrorlabel from '../FieldErrorlabel';
import { AutoCompleteType, Input, InputStyleType } from '../inputs/Input';

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  titleText: string;
  fieldName: FieldPath<T>;
  placeholder: string;
  col: number;
  type?: InputStyleType;
  autoComplete?: AutoCompleteType;
  disabled?: boolean;
}

export const FormField = <T extends FieldValues>({
  control,
  titleText,
  fieldName,
  placeholder,
  col,
  type = InputStyleType.Text,
  autoComplete,
  disabled = false,
}: FormFieldProps<T>): ReactNode => (
  <div className={`flex flex-col col-span-${col}`}>
    <label>{titleText}</label>
    <Controller
      name={fieldName}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <>
          <Input
            {...field}
            type={type}
            value={typeof field.value === 'string' || typeof field.value === 'number' ? field.value : ''}
            onChange={(e) => field.onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            disabled={disabled}
          />
          <FieldErrorlabel error={error} />
        </>
      )}
    />
  </div>
);
