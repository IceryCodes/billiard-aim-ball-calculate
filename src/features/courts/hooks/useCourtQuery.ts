import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { GetCourtDto } from '@/domains/court';
import { useQueryCallback } from '@/hooks/utils/useQueryCallback';
import { courtQueryKeys, getCourt } from '@/services/court';
import { GetCourtReturnType } from '@/services/interfaces';
import { QueryBaseProps, QueryBaseReturnType } from '@/utils/reactQuery';

interface UseCourtQueryProps extends QueryBaseProps<GetCourtReturnType>, GetCourtDto {}

export const useCourtQuery = ({
  onSuccess,
  onError,
  enabled,
  queryPrefixKey = [],
  customLink,
}: UseCourtQueryProps): QueryBaseReturnType<GetCourtReturnType> => {
  const queryResult = useQuery({
    queryKey: [...queryPrefixKey, courtQueryKeys.getCourt, customLink],
    queryFn: () => getCourt({ customLink }),
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
