import { ReactNode, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { UserRoleType } from '@/domains/interface';
import { TokenProps, verifyToken } from '@/utils/token';

interface AdminProtectedProps {
  children: ReactNode;
}

const AdminProtected = ({ children }: AdminProtectedProps): ReactNode => {
  const { isAuthenticated, token } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (typeof window !== 'undefined') {
        if (token) {
          try {
            const { user }: TokenProps = await verifyToken({ token });

            if (isAuthenticated && typeof user._id === 'string' && user.role === UserRoleType.Admin) {
              setHasAccess(true);
            }
          } catch (error) {
            console.error('Token verification failed:', error);
          }
        }
      }
    };
    init();
  }, [isAuthenticated, token]);

  if (!hasAccess) return <></>;

  return <>{children}</>;
};

export default AdminProtected;
