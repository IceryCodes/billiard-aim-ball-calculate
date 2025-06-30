'use client';

import { ReactNode, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { usePaymentsQuery } from '@/features/payments/usePaymentsQuery';
import { useUserQuery } from '@/features/user/hooks/useUserQuery';
import { ToastStyleType } from '@/global-components/Toast';

import { AccountDetail } from './AccountDetail';
import { CourtDetail } from './CourtDetail';
import { PaymentDetail } from './PaymentDetail';
import { PlayerDetail } from './PlayerDetail';

const ProfileContent = (): ReactNode => {
  const router = useRouter();
  const { isAuthenticated, user: userStorage, token, logout } = useAuth();
  const { showToast } = useToast();
  const [isClient, setIsClient] = useState<boolean>(false);

  const {
    data: { user, manage } = {},
    isLoading: userLoading,
    isError,
    refetch,
  } = useUserQuery({
    _id: userStorage?._id,
    enabled: !!userStorage?._id,
    onError: (error) => {
      console.error('User query error:', error);
      showToast({ message: '請重新登入', toastStyle: ToastStyleType.Warning });
      logout();
      router.replace(getPageUrlByType(PageType.LOGIN));
    },
  });

  const { data: { payments = [] } = {}, isLoading: paymentsLoading } = usePaymentsQuery({
    enabled: !!userStorage?._id,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || userLoading || typeof window === 'undefined')
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <label>讀取中...</label>
      </div>
    );

  if (isError || !isAuthenticated || !token || !user)
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <label>找不到帳號</label>
      </div>
    );

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!userLoading && user && token && <AccountDetail user={user} token={token} />}
        {!userLoading && !!manage && <PlayerDetail players={manage.players} refetch={refetch} />}
        {!userLoading && !!manage && <CourtDetail courts={manage.courts} />}
        {!paymentsLoading && <PaymentDetail payments={payments} />}
      </div>
    </div>
  );
};

export default ProfileContent;
