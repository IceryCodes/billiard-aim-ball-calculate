import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { GetCourtsDto } from '@/domains/court';
import { useQueryCallback } from '@/hooks/utils/useQueryCallback';
import { courtQueryKeys, getCourts } from '@/services/court';
import { GetCourtsReturnType } from '@/services/interfaces';
import { QueryBaseProps, QueryBaseReturnType } from '@/utils/reactQuery';

interface UseCourtsQueryProps extends QueryBaseProps<GetCourtsReturnType>, GetCourtsDto {}

export const useCourtsQuery = ({
  onSuccess,
  onError,
  enabled,
  queryPrefixKey = [],
  query,
  county,
  coaches = [],
  keywords = [],
  fullDay,
  partner,
  page,
  limit,
}: UseCourtsQueryProps): QueryBaseReturnType<GetCourtsReturnType> => {
  const queryResult = useQuery({
    queryKey: [...queryPrefixKey, courtQueryKeys.getCourts, query, county, keywords, fullDay, partner, page, limit],
    queryFn: () => getCourts({ query, county, coaches, keywords, fullDay, partner, page, limit }),
    enabled,
  });

  const {
    isFetching,
    isError,
    error,
    data = {
      courts: [],
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
