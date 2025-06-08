import { useCallback } from 'react';

import { Controller, useForm } from 'react-hook-form';

import { GetCourtsDto } from '@/domains/court';
import { CountyType } from '@/domains/interface';
import { Button } from '@/global-components/buttons/Button';
import { Input, InputStyleType } from '@/global-components/inputs/Input';
import { Select } from '@/global-components/selects/Select';

interface ItemsSearchProps {
  searchItems: (formData: GetCourtsDto) => void;
}

const ItemsSearch = ({ searchItems }: ItemsSearchProps) => {
  const { control, handleSubmit, reset } = useForm<GetCourtsDto>({
    defaultValues: {
      query: '',
      county: '',
      coaches: [],
      partner: false,
    },
  });

  const onSubmit = useCallback(
    (formData: GetCourtsDto) => {
      searchItems(formData);
      reset(formData);
    },
    [reset, searchItems]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-2 mb-4 w-full">
      <div className="flex flex-row-reverse justify-between gap-x-4">
        <Button text="搜尋" type="submit" className="col-span-1" />

        <Controller
          name="fullDay"
          control={control}
          render={({ field: { onChange, value } }) => (
            <div className="flex items-center col-span-2">
              <Input type={InputStyleType.Checkbox} checked={value} onChange={(e) => onChange(e.target.checked)} />
              <label className="text-sm">24小時營業</label>
            </div>
          )}
        />
        <Controller
          name="partner"
          control={control}
          render={({ field: { onChange, value } }) => (
            <div className="flex items-center col-span-2">
              <Input type={InputStyleType.Checkbox} checked={value} onChange={(e) => onChange(e.target.checked)} />
              <label className="text-sm">{`${process.env.NEXT_PUBLIC_SITENAME}合作夥伴`}</label>
            </div>
          )}
        />
      </div>

      <Controller name="query" control={control} render={({ field }) => <Input placeholder="撞球場地名稱" {...field} />} />

      <div className="flex justify-between gap-x-4">
        <Controller
          name="county"
          control={control}
          render={({ field }) => <Select {...field} defaultValue="所有縣市" options={Object.values(CountyType)} />}
        />
      </div>
    </form>
  );
};

export default ItemsSearch;
