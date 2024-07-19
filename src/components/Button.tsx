import type { ReactElement } from "react";
import type { ButtonProps } from "./Interface";

export const Button = ({
  value,
  angle,
  setAngle,
}: ButtonProps): ReactElement => (
  <button type="button" onClick={() => setAngle(value)}>
    {angle}
  </button>
);
