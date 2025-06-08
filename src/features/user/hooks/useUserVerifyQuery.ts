import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { UserVerifyDto } from '@/domains/user';
import { useQueryCallback } from '@/hooks/utils/useQueryCallback';
import { UserVerifyReturnType } from '@/services/interfaces';
import { userQueryKeys, verifyUser } from '@/services/user';
import { QueryBaseProps, QueryBaseReturnType } from '@/utils/reactQuery';

interface UseUserVerifyQueryProps extends QueryBaseProps<UserVerifyReturnType>, UserVerifyDto {}

export const useUserVerifyQuery = ({
  onSuccess,
  onError,
  enabled,
  queryPrefixKey = [],
  token,
}: UseUserVerifyQueryProps): QueryBaseReturnType<UserVerifyReturnType> => {
  const queryResult = useQuery({
    queryKey: [...queryPrefixKey, userQueryKeys.verifyUser, token],
    queryFn: () => verifyUser({ token }),
    enabled,
  });
  const { isFetching, isError, error, data, refetch } = queryResult;
  useQueryCallback({ ...queryResult, onSuccess, onError });

  return useMemo(() => {
    return {
      isLoading: isFetching,
      isError,
      error,
      refetch,
      data,
    };
  }, [isFetching, isError, data, error, refetch]);
};
