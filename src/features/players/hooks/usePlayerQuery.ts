import { useQuery } from '@tanstack/react-query';

import { GetPlayerDto } from '@/domains/player';
import { requestLimit } from '@/features/helper';
import { useQueryCallback } from '@/hooks/utils/useQueryCallback';
import { GetPlayerReturnType } from '@/services/interfaces';
import { getPlayer, playerQueryKeys } from '@/services/player';
import { QueryBaseProps, QueryBaseReturnType } from '@/utils/reactQuery';

interface UsePlayerQueryProps extends QueryBaseProps<GetPlayerReturnType>, GetPlayerDto {}

export const usePlayerQuery = ({
  onSuccess,
  onError,
  enabled = true,
  queryPrefixKey = [],
  customLink,
}: UsePlayerQueryProps): QueryBaseReturnType<GetPlayerReturnType> => {
  const queryResult = useQuery({
    queryKey: [...queryPrefixKey, playerQueryKeys.getPlayer, customLink],
    queryFn: () => getPlayer({ customLink }),
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
