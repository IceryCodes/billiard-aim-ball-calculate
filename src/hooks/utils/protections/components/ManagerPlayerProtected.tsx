import { ReactNode, useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { UserRoleType } from '@/domains/interface';
import { PlayerProps } from '@/domains/player';
import { TokenProps, verifyToken } from '@/utils/token';

interface ManagerPlayerProtectedProps {
  children: ReactNode;
  pageId: string;
}

const ManagerPlayerProtected = ({ children, pageId }: ManagerPlayerProtectedProps): ReactNode => {
  const { isAuthenticated, token } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  const isMatch = useCallback(
    (items: PlayerProps[]): boolean => items.some((obj) => obj._id.toString() === pageId),
    [pageId]
  );

  useEffect(() => {
    const init = async () => {
      if (typeof window !== 'undefined') {
        if (token) {
          try {
            const {
              user,
              manage: { players },
            }: TokenProps = await verifyToken({ token });

            if (isAuthenticated && typeof user._id === 'string' && user.role === UserRoleType.Admin) {
              setHasAccess(true);
              return;
            }

            const usedItems: PlayerProps[] = players;
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

export default ManagerPlayerProtected;
