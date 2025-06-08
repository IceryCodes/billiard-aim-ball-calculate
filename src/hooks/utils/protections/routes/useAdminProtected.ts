'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { getPageUrlByType, PageType, UserRoleType } from '@/domains/interface';

const useAdminProtected = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== UserRoleType.Admin) {
      logout();
      router.push(getPageUrlByType(PageType.LOGIN));
    }
  }, [isAuthenticated, user, logout, router]);
};

export default useAdminProtected;
