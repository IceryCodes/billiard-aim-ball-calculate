import { Slider } from "antd";
import type { ReactElement } from "react";
import type { SliderProps } from "./Interface";

export const SliderBar = ({
  min,
  max,
  step,
  value,
  defaultValue,
  onChange,
  style,
}: SliderProps): ReactElement => (
  <Slider
    min={min}
    max={max}
    step={step}
    value={value}
    defaultValue={defaultValue}
    onChange={onChange}
    style={style}
    tooltip={{ formatter: null }}
  />
);
