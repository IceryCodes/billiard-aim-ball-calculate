import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useQueryCallback } from '@/hooks/utils/useQueryCallback';
import { GetPaymentsReturnType } from '@/services/interfaces';
import { getPayments, paymentQueryKeys } from '@/services/payment';
import { QueryBaseProps, QueryBaseReturnType } from '@/utils/reactQuery';

type UsePaymentsQueryProps = QueryBaseProps<GetPaymentsReturnType>;

export const usePaymentsQuery = ({
  onSuccess,
  onError,
  enabled,
  queryPrefixKey = [],
}: UsePaymentsQueryProps): QueryBaseReturnType<GetPaymentsReturnType> => {
  const queryResult = useQuery({
    queryKey: [...queryPrefixKey, paymentQueryKeys.getPayments],
    queryFn: () => getPayments(),
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
