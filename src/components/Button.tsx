import type { ReactElement } from "react";

const style = {
  backgroundColor: "transparent",
  borderRadius: 5,
  borderWidth: 1,
  borderColor: "#00000080",
  width: 40,
};

export const Button = ({
  value,
  angle,
  setAngle,
}: {
  value: number;
  angle: string;
  setAngle: (value: number) => void;
}): ReactElement => (
  <button type="button" onClick={() => setAngle(value)} style={style}>
    {angle}
  </button>
);
