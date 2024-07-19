import type { ReactElement } from "react";
import type { CheckboxItemProps } from "./Interface";
import { Checkbox } from "antd";

export const CheckboxItem = ({
  label,
  checked,
  setChecked,
}: CheckboxItemProps): ReactElement => (
  <Checkbox
    checked={checked}
    onChange={() => setChecked(!checked)}
    className="unselectable"
  >
    {label}
  </Checkbox>
);
