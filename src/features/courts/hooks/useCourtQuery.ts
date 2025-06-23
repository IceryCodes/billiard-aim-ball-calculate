import { useQuery } from '@tanstack/react-query';

import { GetCourtDto } from '@/domains/court';
import { requestLimit } from '@/features/helper';
import { useQueryCallback } from '@/hooks/utils/useQueryCallback';
import { courtQueryKeys, getCourt } from '@/services/court';
import { GetCourtReturnType } from '@/services/interfaces';
import { QueryBaseProps, QueryBaseReturnType } from '@/utils/reactQuery';

interface UseCourtQueryProps extends QueryBaseProps<GetCourtReturnType>, GetCourtDto {}

export const useCourtQuery = ({
  onSuccess,
  onError,
  enabled = true,
  queryPrefixKey = [],
  customLink,
}: UseCourtQueryProps): QueryBaseReturnType<GetCourtReturnType> => {
  const queryResult = useQuery({
    queryKey: [...queryPrefixKey, courtQueryKeys.getCourt, customLink],
    queryFn: () => getCourt({ customLink }),
    enabled: Boolean(customLink) && enabled,
    ...requestLimit,
  });

  const { isFetching, isError, error, data, refetch } = queryResult;

  useQueryCallback({ ...queryResult, onSuccess, onError });

  // 直接返回，不使用 useMemo
  return {
    isLoading: isFetching,
    isError,
    error,
    refetch,
    data,
  };
};
