'use client';

import { useEffect } from 'react';

import { WithId } from 'mongodb';
import { useParams, useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { CourtProps } from '@/domains/court';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { useTournamentQuery } from '@/features/tournaments/hooks/useTournamentQuery';
import { TokenProps, verifyToken } from '@/utils/token';

const useTournamentProtected = () => {
  const { isAuthenticated, token, logout } = useAuth();
  const router = useRouter();
  const params = useParams();

  const paramsId: string = params?.customLink as string;
  const { data: { tournament } = {}, isLoading } = useTournamentQuery({ customLink: paramsId });

  useEffect(() => {
    const init = async () => {
      if (!isAuthenticated || !token) {
        console.error('尚未登入或登入資訊不完整');
        logout();
        router.push(getPageUrlByType(PageType.LOGIN));
        return;
      }

      const {
        manage: { courts = [] },
      }: TokenProps = await verifyToken({ token });

      if (!isLoading && !courts.some((court: WithId<CourtProps>) => court._id === tournament?.court)) {
        console.error('沒有頁面權限');
        logout();
        router.push(getPageUrlByType(PageType.LOGIN));
      }
    };
    init();
  }, [isAuthenticated, logout, router, token, isLoading, tournament?.court]);
};

export default useTournamentProtected;
