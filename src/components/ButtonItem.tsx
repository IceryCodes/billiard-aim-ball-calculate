import type { ReactElement } from "react";
import type { ButtonItemProps } from "./Interface";
import { Button } from "antd";

export const ButtonItem = ({
  value,
  currentValue,
  angle,
  setAngle,
}: ButtonItemProps): ReactElement => (
  <Button
    type={currentValue === value ? "primary" : "dashed"}
    className={currentValue === value ? "" : "inactive-button"}
    style={{ width: 50 }}
    onClick={() => setAngle(value)}
  >
    {angle}
  </Button>
);
