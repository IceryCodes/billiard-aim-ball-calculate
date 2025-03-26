import type { ReactElement } from 'react';

import { Checkbox } from 'antd';

import type { CheckboxItemProps } from './Interface';

export const CheckboxItem = ({ label, checked, setChecked }: CheckboxItemProps): ReactElement => (
  <Checkbox checked={checked} onChange={() => setChecked(!checked)} className="unselectable">
    {label}
  </Checkbox>
);
