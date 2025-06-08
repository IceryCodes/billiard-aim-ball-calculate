import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { GetUserDto } from '@/domains/user';
import { useQueryCallback } from '@/hooks/utils/useQueryCallback';
import { GetUserReturnType } from '@/services/interfaces';
import { getUser, userQueryKeys } from '@/services/user';
import { QueryBaseProps, QueryBaseReturnType } from '@/utils/reactQuery';

interface UseUserQueryProps extends QueryBaseProps<GetUserReturnType>, GetUserDto {}

export const useUserQuery = ({
  onSuccess,
  onError,
  enabled,
  queryPrefixKey = [],
  _id,
}: UseUserQueryProps): QueryBaseReturnType<GetUserReturnType> => {
  const queryResult = useQuery({
    queryKey: [...queryPrefixKey, userQueryKeys.getUser, _id],
    queryFn: () => getUser({ _id }),
    enabled: enabled && !!_id,
  });

  const {
    isFetching,
    isError,
    error,
    data = {
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
