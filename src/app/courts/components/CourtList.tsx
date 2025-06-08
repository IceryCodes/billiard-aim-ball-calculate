'use client';
import { ReactNode, useCallback, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';

import { CourtProps, GetCourtsDto } from '@/domains/court';
import { CountyType, PageType } from '@/domains/interface';
import { useCourtsQuery } from '@/features/courts/hooks/useCourtsQuery';
import { Button } from '@/global-components/buttons/Button';
import GoogleMapComponentNew from '@/global-components/google-map/GoogleMapComponentNew';
import { Input, InputStyleType } from '@/global-components/inputs/Input';
import Pagination from '@/global-components/Pagination';
import { Select } from '@/global-components/selects/Select';

import CourtListItemCard from './CourtListItemCard';

const limit = 12;

interface CourtListProps {
  switchMode: () => void;
}

const CourtList = ({ switchMode }: CourtListProps): ReactNode => {
  const { control, handleSubmit, getValues, reset } = useForm<GetCourtsDto>({
    defaultValues: {
      query: '',
      county: '',
      coaches: [],
      keywords: [],
      fullDay: false,
      partner: false,
    },
  });

  const [currentPage, setCurrentPage] = useState<number>(1);

  const {
    data: { courts = [], total = 0 } = {},
    isLoading,
    isError,
    refetch,
  } = useCourtsQuery({
    query: getValues('query'),
    county: getValues('county'),
    coaches: getValues('coaches'),
    keywords: getValues('keywords'),
    fullDay: getValues('fullDay'),
    partner: getValues('partner'),
    page: currentPage,
    limit,
  });

  const totalPages = Math.ceil(total / limit);

  const onPageChange = useCallback((page: number) => setCurrentPage(page), []);

  const onSubmit = useCallback(
    (formData: GetCourtsDto) => {
      refetch();
      reset(formData);
      setCurrentPage(1);
    },
    [refetch, reset]
  );

  return (
    <div className="container mx-auto p-6 flex flex-col gap-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">{PageType.COURTS}</h1>
        <Button text="切換地圖模式" onClick={switchMode} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-4/5">
          <Controller
            name="query"
            control={control}
            render={({ field }) => <Input placeholder="撞球場地名稱" {...field} />}
          />

          <Controller
            name="county"
            control={control}
            render={({ field }) => <Select {...field} defaultValue="所有縣市" options={Object.values(CountyType)} />}
          />

          <Controller
            name="fullDay"
            control={control}
            render={({ field: { onChange, value } }) => (
              <div className="flex items-center">
                <Input type={InputStyleType.Checkbox} checked={value} onChange={(e) => onChange(e.target.checked)} />
                <label className="text-sm">24小時營業</label>
              </div>
            )}
          />

          <Controller
            name="partner"
            control={control}
            render={({ field: { onChange, value } }) => (
              <div className="flex items-center">
                <Input type={InputStyleType.Checkbox} checked={value} onChange={(e) => onChange(e.target.checked)} />
                <label className="text-sm">{`${process.env.NEXT_PUBLIC_SITENAME}合作夥伴`}</label>
              </div>
            )}
          />
        </div>

        <div className="w-1/5">
          <Button text="搜尋" type="submit" className="w-full" />
        </div>
      </form>

      <GoogleMapComponentNew key={courts?.length} locationData={courts} />

      {/* Loading overlay */}
      <div className="relative w-full min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 flex justify-center items-center bg-backgroundLight">
            <span className="text-gray-500 text-lg">搜尋中...</span>
          </div>
        )}
        {isError && <span>搜尋時發生錯誤</span>}

        {/* Court list */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {!courts.length && <label>沒有符合的撞球場地</label>}
          {courts.map(
            ({ title, partner, county, district, address, featuredImg, coachs, customLink }: CourtProps, index: number) => (
              <CourtListItemCard
                key={index}
                image={featuredImg ? featuredImg : process.env.NEXT_PUBLIC_FEATURED_IMAGE}
                title={title}
                county={county}
                district={district}
                address={address}
                coachs={coachs}
                partner={partner}
                customLink={customLink}
              />
            )
          )}
        </section>

        {/* Pagination */}
        <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={onPageChange} />
      </div>
    </div>
  );
};

export default CourtList;
