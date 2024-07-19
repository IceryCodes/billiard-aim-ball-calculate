import { Slider } from "antd";
import type { ReactElement } from "react";
import type { SliderItemProps } from "./Interface";

export const SliderItem = ({
  min,
  max,
  step,
  value,
  defaultValue,
  onChange,
  style,
}: SliderItemProps): ReactElement => (
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
