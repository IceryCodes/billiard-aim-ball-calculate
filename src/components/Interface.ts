export interface ButtonItemProps {
  value: number;
  currentValue: number;
  angle: string;
  setAngle: (value: number) => void;
}

export interface SliderItemProps {
  min: number;
  max: number;
  step: number;
  value: number;
  defaultValue?: number;
  onChange: (value: number) => void;
  style?: React.CSSProperties;
}

export interface CheckboxItemProps {
  label: string;
  checked: boolean;
  setChecked: (value: boolean) => void;
}
