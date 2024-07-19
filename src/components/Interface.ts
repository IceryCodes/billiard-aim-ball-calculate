export interface ButtonProps {
  value: number;
  angle: string;
  setAngle: (value: number) => void;
}

export interface SliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  defaultValue?: number;
  onChange: (value: number) => void;
  style?: React.CSSProperties;
}
