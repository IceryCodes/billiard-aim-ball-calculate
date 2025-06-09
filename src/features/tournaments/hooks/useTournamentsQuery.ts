import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { GetTournamentsDto } from '@/domains/tournament';
import { useQueryCallback } from '@/hooks/utils/useQueryCallback';
import { GetTournamentsReturnType } from '@/services/interfaces';
import { getTournaments, tournamentQueryKeys } from '@/services/tournament';
import { QueryBaseProps, QueryBaseReturnType } from '@/utils/reactQuery';

interface UseTournamentsQueryProps extends QueryBaseProps<GetTournamentsReturnType>, GetTournamentsDto {}

export const useTournamentsQuery = ({
  onSuccess,
  onError,
  enabled,
  queryPrefixKey = [],
  court,
  page,
  limit,
}: UseTournamentsQueryProps): QueryBaseReturnType<GetTournamentsReturnType> => {
  const queryResult = useQuery({
    queryKey: [...queryPrefixKey, tournamentQueryKeys.getTournaments, page, limit],
    queryFn: () => getTournaments({ court, page, limit }),
    enabled,
  });

  const {
    isFetching,
    isError,
    error,
    data = {
      tournaments: [],
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
