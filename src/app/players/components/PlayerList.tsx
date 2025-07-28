'use client';
import { ReactNode, useCallback, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';

import { PageType } from '@/domains/interface';
import { GetPlayersDto, PlayerProps } from '@/domains/player';
import { usePlayersQuery } from '@/features/players/hooks/usePlayersQuery';
import { Button } from '@/global-components/buttons/Button';
import { Input } from '@/global-components/inputs/Input';
import Pagination from '@/global-components/Pagination';

import PlayerListItemCard from './PlayerListItemCard';

const limit = 12;

const PlayerList = (): ReactNode => {
  const { control, handleSubmit, getValues, reset } = useForm<GetPlayersDto>({
    defaultValues: {
      query: '',
    },
  });

  const [currentPage, setCurrentPage] = useState<number>(1);

  const {
    data: { players = [], total = 0 } = {},
    isLoading,
    isError,
    refetch,
  } = usePlayersQuery({
    query: getValues('query'),
    page: currentPage,
    limit,
  });

  const totalPages = Math.ceil(total / limit);

  const onPageChange = useCallback((page: number) => setCurrentPage(page), []);

  const onSubmit = useCallback(
    (formData: GetPlayersDto) => {
      refetch();
      reset(formData);
      setCurrentPage(1);
    },
    [refetch, reset]
  );

  return (
    <div className="container mx-auto p-6 flex flex-col gap-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">{PageType.PLAYERS}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-4/5">
          <Controller
            name="query"
            control={control}
            render={({ field }) => <Input placeholder="撞球選手名稱" {...field} />}
          />
        </div>

        <div className="w-1/5">
          <Button text="搜尋" type="submit" className="w-full" />
        </div>
      </form>

      {/* Loading overlay */}
      <div className="relative w-full min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 flex justify-center items-center bg-backgroundLight">
            <span className="text-gray-500 text-lg">搜尋中...</span>
          </div>
        )}
        {isError && <span>搜尋時發生錯誤</span>}

        {/* Player list */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {!players.length && <label>沒有符合的撞球選手</label>}
          {players.map(({ title, partner, county, district, featuredImg, customLink }: PlayerProps, index: number) => {
            const featuredImageUrl = featuredImg
              ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_PLAYER_FEATURED_FOLDER}/${featuredImg}`
              : `${process.env.NEXT_PUBLIC_BASE_URL}${process.env.NEXT_PUBLIC_FEATURED_IMAGE}`;

            return (
              <PlayerListItemCard
                key={index}
                image={featuredImageUrl}
                title={title}
                county={county}
                district={district}
                partner={partner}
                customLink={customLink}
              />
            );
          })}
        </section>

        {/* Pagination */}
        <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={onPageChange} />
      </div>
    </div>
  );
};

export default PlayerList;
