import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { GetUsersDto } from '@/domains/user';
import { useQueryCallback } from '@/hooks/utils/useQueryCallback';
import { GetUsersReturnType } from '@/services/interfaces';
import { getUsers, userQueryKeys } from '@/services/user';
import { QueryBaseProps, QueryBaseReturnType } from '@/utils/reactQuery';

interface UseUserQueryProps extends QueryBaseProps<GetUsersReturnType>, GetUsersDto {}

export const useUsersQuery = ({
  onSuccess,
  onError,
  enabled,
  queryPrefixKey = [],
  email,
}: UseUserQueryProps): QueryBaseReturnType<GetUsersReturnType> => {
  const queryResult = useQuery({
    queryKey: [...queryPrefixKey, userQueryKeys.getUsers, email],
    queryFn: () => getUsers({ email }),
    enabled,
  });

  const {
    isFetching,
    isError,
    error,
    data = {
      users: [],
      total: 0,
      message: '',
    },
    refetch,
  } = queryResult;
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
