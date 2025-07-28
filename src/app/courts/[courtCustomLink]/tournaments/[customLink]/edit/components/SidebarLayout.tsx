import { ReactNode } from 'react';

import { useRouter } from 'next/navigation';

import TournamentListItemCard from '@/app/tournaments/components/TournamentListItemCard';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { TournamentProps } from '@/domains/tournament';
import { useTournamentsQuery } from '@/features/tournaments/hooks/useTournamentsQuery';
import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
import Card from '@/global-components/Card';

interface SidebarLayoutProps {
  pageId: string;
  children: ReactNode;
}

const SidebarLayout = ({ pageId, children }: SidebarLayoutProps) => {
  const router = useRouter();

  const {
    data: { tournaments = [] } = {},
    isLoading,
    isError,
  } = useTournamentsQuery({
    page: 1,
    limit: 6,
    excludeId: pageId,
  });

  return (
    <div className="flex gap-x-8">
      <div className=" w-full md:w-2/3">{children}</div>
      <div className="w-1/3 flex-col hidden md:flex">
        <Card>
          <label className="text-xl font-bold">其他球場賽程資料</label>
          <Button
            text="返回列表"
            buttonStyle={ButtonStyleType.Disabled}
            onClick={() => router.push(getPageUrlByType(PageType.TOURNAMENTS))}
            className="rounded w-full"
          />
        </Card>

        <div className="relative w-full">
          {isLoading && (
            <div className="absolute inset-0 flex justify-center items-center bg-backgroundLight">
              <span className="text-gray-500 text-lg">搜尋中...</span>
            </div>
          )}
          {isError && <span>搜尋球場賽程資料出現錯誤</span>}

          {/* Tournament list */}
          <div className="grid grid-cols-1 gap-4 p-4">
            {!tournaments.length && <label>沒有符合球場賽程資料</label>}
            {tournaments.map((tournament: TournamentProps) => {
              const featuredImageUrl = tournament.featuredImg
                ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_TOURNAMENT_FEATURED_FOLDER}/${tournament.featuredImg}`
                : `${process.env.NEXT_PUBLIC_BASE_URL}${process.env.NEXT_PUBLIC_FEATURED_IMAGE}`;

              return <TournamentListItemCard key={tournament._id} image={featuredImageUrl} tournament={tournament} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarLayout;
