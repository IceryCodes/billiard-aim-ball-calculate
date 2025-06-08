import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { GetTournamentDto } from '@/domains/tournament';
import { useQueryCallback } from '@/hooks/utils/useQueryCallback';
import { GetTournamentReturnType } from '@/services/interfaces';
import { getTournament, tournamentQueryKeys } from '@/services/tournament';
import { QueryBaseProps, QueryBaseReturnType } from '@/utils/reactQuery';

interface UseTournamentQueryProps extends QueryBaseProps<GetTournamentReturnType>, GetTournamentDto {}

export const useTournamentQuery = ({
  onSuccess,
  onError,
  enabled,
  queryPrefixKey = [],
  customLink,
}: UseTournamentQueryProps): QueryBaseReturnType<GetTournamentReturnType> => {
  const queryResult = useQuery({
    queryKey: [...queryPrefixKey, tournamentQueryKeys.getTournament, customLink],
    queryFn: () => getTournament({ customLink }),
    enabled: Boolean(customLink) && enabled,
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
