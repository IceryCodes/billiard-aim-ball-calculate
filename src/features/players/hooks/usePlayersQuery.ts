import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { GetPlayersDto } from '@/domains/player';
import { useQueryCallback } from '@/hooks/utils/useQueryCallback';
import { GetPlayersReturnType } from '@/services/interfaces';
import { getPlayers, playerQueryKeys } from '@/services/player';
import { QueryBaseProps, QueryBaseReturnType } from '@/utils/reactQuery';

interface UsePlayersQueryProps extends QueryBaseProps<GetPlayersReturnType>, GetPlayersDto {}

export const usePlayersQuery = ({
  onSuccess,
  onError,
  enabled,
  queryPrefixKey = [],
  query = '',
  page = 1,
  limit = 10,
}: UsePlayersQueryProps): QueryBaseReturnType<GetPlayersReturnType> => {
  const queryResult = useQuery({
    queryKey: [...queryPrefixKey, playerQueryKeys.getPlayers, query, page, limit],
    queryFn: () => getPlayers({ query, page, limit }),
    enabled,
  });

  const {
    isFetching,
    isError,
    error,
    data = {
      players: [],
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
