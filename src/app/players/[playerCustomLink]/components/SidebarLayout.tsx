import { ReactNode, useCallback } from 'react';

import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';

import PlayerListItemCard from '@/app/players/components/PlayerListItemCard';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { GetPlayersDto, PlayerProps } from '@/domains/player';
import { usePlayersQuery } from '@/features/players/hooks/usePlayersQuery';
import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
import Card from '@/global-components/Card';
import { Input } from '@/global-components/inputs/Input';

interface SidebarLayoutProps {
  pageId: string;
  county: string;
  children: ReactNode;
}

const limit = 6;

const SidebarLayout = ({ pageId, children }: SidebarLayoutProps) => {
  const router = useRouter();
  const { control, handleSubmit, getValues, reset } = useForm<GetPlayersDto>({
    defaultValues: {
      query: '',
    },
  });

  const {
    data: { players = [] } = {},
    isLoading,
    isError,
    refetch,
  } = usePlayersQuery({
    query: getValues('query'),
    limit,
  });

  const onSubmit = useCallback(
    (formData: GetPlayersDto) => {
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
            <label className="text-xl font-bold">附近其他{PageType.PLAYERS}</label>
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
                name="query"
                control={control}
                render={({ field }) => <Input placeholder={`${PageType.PLAYERS}名稱`} {...field} />}
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
          {isError && <span>搜尋附近{PageType.PLAYERS}出現錯誤</span>}

          {/* Player list */}
          <div className="grid grid-cols-1 gap-4 p-4">
            {!players.length && <label>附近沒有符合{PageType.PLAYERS}</label>}
            {players
              .filter(({ _id }: PlayerProps) => _id !== pageId)
              .map(({ _id, title, partner, county, district, featuredImg, customLink }: PlayerProps) => (
                <PlayerListItemCard
                  key={_id}
                  image={
                    featuredImg
                      ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_FEATURED_IMAGE_FOLDER}/${featuredImg}`
                      : process.env.NEXT_PUBLIC_FEATURED_IMAGE
                  }
                  title={title}
                  county={county}
                  district={district}
                  partner={partner}
                  customLink={customLink}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarLayout;
