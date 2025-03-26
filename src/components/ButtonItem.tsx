import type { ReactElement } from 'react';

import { Button } from 'antd';

import type { ButtonItemProps } from './Interface';

export const ButtonItem = ({ value, currentValue, angle, setAngle }: ButtonItemProps): ReactElement => (
  <Button
    type={currentValue === value ? 'primary' : 'dashed'}
    className={currentValue === value ? '' : 'inactive-button'}
    style={{ width: 50 }}
    onClick={() => setAngle(value)}
  >
    {angle}
  </Button>
);
