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
  const { isAuthenticated, token, logout, isLoading: authLoading } = useAuth(); // 新增 authLoading
  const router = useRouter();
  const params = useParams();

  const paramsId: string = params?.customLink as string;
  const { data: { tournament } = {}, isLoading: tournamentLoading } = useTournamentQuery({ customLink: paramsId });

  useEffect(() => {
    const init = async () => {
      if (authLoading) return;

      if (!isAuthenticated || !token) {
        console.error('尚未登入或登入資訊不完整', isAuthenticated, token);
        logout();
        router.push(getPageUrlByType(PageType.LOGIN));
        return;
      }

      if (tournamentLoading) return;

      try {
        const {
          manage: { courts = [] },
        }: TokenProps = await verifyToken({ token });

        // 檢查用戶是否有權限管理該 tournament 的 court
        if (!courts.some((court: WithId<CourtProps>) => court._id === tournament?.court)) {
          console.error('沒有頁面權限');
          logout();
          router.push(getPageUrlByType(PageType.LOGIN));
        }
      } catch (error) {
        console.error('Token 驗證失敗:', error);
        logout();
        router.push(getPageUrlByType(PageType.LOGIN));
      }
    };

    init();
  }, [isAuthenticated, logout, router, token, authLoading, tournamentLoading, tournament?.court]);
};

export default useTournamentProtected;
