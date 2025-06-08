import { ReactNode, useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { CourtProps } from '@/domains/court';
import { UserRoleType } from '@/domains/interface';
import { TokenProps, verifyToken } from '@/utils/token';

interface ManagerCourtProtectedProps {
  children: ReactNode;
  pageId: string;
}

const ManagerCourtProtected = ({ children, pageId }: ManagerCourtProtectedProps): ReactNode => {
  const { isAuthenticated, token } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  const isMatch = useCallback(
    (items: CourtProps[]): boolean => items.some((obj) => obj._id.toString() === pageId),
    [pageId]
  );

  useEffect(() => {
    const init = async () => {
      if (typeof window !== 'undefined') {
        if (token) {
          try {
            const {
              user,
              manage: { courts },
            }: TokenProps = await verifyToken({ token });

            if (isAuthenticated && typeof user._id === 'string' && user.role === UserRoleType.Admin) {
              setHasAccess(true);
              return;
            }

            const usedItems: CourtProps[] = courts;
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

export default ManagerCourtProtected;
