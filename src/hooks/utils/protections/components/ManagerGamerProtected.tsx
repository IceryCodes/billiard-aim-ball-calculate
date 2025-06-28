import { ReactNode, useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { GamerProps } from '@/domains/gamer';
import { UserRoleType } from '@/domains/interface';
import { TokenProps, verifyToken } from '@/utils/token';

interface ManagerGamerProtectedProps {
  children: ReactNode;
  pageId: string;
}

const ManagerGamerProtected = ({ children, pageId }: ManagerGamerProtectedProps): ReactNode => {
  const { isAuthenticated, token } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  const isMatch = useCallback(
    (items: GamerProps[]): boolean => items.some((obj) => obj._id.toString() === pageId),
    [pageId]
  );

  useEffect(() => {
    const init = async () => {
      if (typeof window !== 'undefined') {
        if (token) {
          try {
            const {
              user,
              manage: { gamers },
            }: TokenProps = await verifyToken({ token });

            if (isAuthenticated && typeof user._id === 'string' && user.role === UserRoleType.Admin) {
              setHasAccess(true);
              return;
            }

            const usedItems: GamerProps[] = gamers;
            setHasAccess(isMatch(usedItems));
          } catch (error) {
            console.error('Token verification failed:', error);
          }
        }
      }
    };
    init();
  }, [isAuthenticated, isMatch, token]);

  if (!hasAccess) return <></>;

  return <>{children}</>;
};

export default ManagerGamerProtected;
