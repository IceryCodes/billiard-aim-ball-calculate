import { ReactNode, useCallback } from 'react';

import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';

import CourtListItemCard from '@/app/courts/components/CourtListItemCard';
import { CourtProps, GetCourtsDto } from '@/domains/court';
import { CountyType, getPageUrlByType, PageType } from '@/domains/interface';
import { useCourtsQuery } from '@/features/courts/hooks/useCourtsQuery';
import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
import Card from '@/global-components/Card';
import { Input, InputStyleType } from '@/global-components/inputs/Input';
import { Select } from '@/global-components/selects/Select';

interface SidebarLayoutProps {
  pageId: string;
  county: string;
  children: ReactNode;
}

const limit = 6;

const SidebarLayout = ({ pageId, county, children }: SidebarLayoutProps) => {
  const router = useRouter();
  const { control, handleSubmit, getValues, reset } = useForm<GetCourtsDto>({
    defaultValues: {
      query: '',
      county,
      fullDay: false,
      partner: false,
    },
  });

  const {
    data: { courts = [] } = {},
    isLoading,
    isError,
    refetch,
  } = useCourtsQuery({
    query: getValues('query'),
    county: getValues('county'),
    coaches: [],
    keywords: [],
    fullDay: getValues('fullDay'),
    partner: getValues('partner'),
    limit,
  });

  const onSubmit = useCallback(
    (formData: GetCourtsDto) => {
      refetch();
      reset(formData);
    },
    [refetch, reset]
  );

  return (
    <div className="flex gap-x-8">
      <div className=" w-full md:w-2/3">{children}</div>
      <div className="w-1/3 flex-col hidden md:flex">
        <Card>
          <>
            <label className="text-xl font-bold">附近其他撞球場地</label>
            {/* search form */}
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 mb-4">
              <div className="flex gap-x-2">
                <Button
                  text="返回列表"
                  buttonStyle={ButtonStyleType.Disabled}
                  onClick={() => router.push(getPageUrlByType(PageType.COURTS))}
                  className="rounded w-2/3"
                />

                <Button text="搜尋" type="submit" className="w-1/3" />
              </div>

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
            </form>
          </>
        </Card>

        <div className="relative w-full">
          {isLoading && (
            <div className="absolute inset-0 flex justify-center items-center bg-backgroundLight">
              <span className="text-gray-500 text-lg">搜尋中...</span>
            </div>
          )}
          {isError && <span>搜尋附近撞球場地出現錯誤</span>}

          {/* Court list */}
          <div className="grid grid-cols-1 gap-4 p-4">
            {!courts.length && <label>附近沒有符合撞球場地</label>}
            {courts
              .filter(({ _id }: CourtProps) => _id.toString() !== pageId)
              .map(({ _id, title, partner, county, district, address, featuredImg, customLink, coachs }: CourtProps) => (
                <CourtListItemCard
                  key={_id.toString()}
                  image={
                    featuredImg
                      ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_FEATURED_IMAGE_FOLDER}/${featuredImg}`
                      : process.env.NEXT_PUBLIC_FEATURED_IMAGE
                  }
                  title={title}
                  county={county}
                  district={district}
                  address={address}
                  partner={partner}
                  customLink={customLink}
                  coachs={coachs}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarLayout;
