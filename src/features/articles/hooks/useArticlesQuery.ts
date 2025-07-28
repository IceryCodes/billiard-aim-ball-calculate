import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { GetArticlesDto } from '@/domains/article';
import { useQueryCallback } from '@/hooks/utils/useQueryCallback';
import { articleQueryKeys, getArticles } from '@/services/article';
import { GetArticlesReturnType } from '@/services/interfaces';
import { QueryBaseProps, QueryBaseReturnType } from '@/utils/reactQuery';

interface UseArticlesQueryProps extends QueryBaseProps<GetArticlesReturnType>, GetArticlesDto {}

export const useArticlesQuery = ({
  onSuccess,
  onError,
  enabled,
  queryPrefixKey = [],
  page,
  limit,
}: UseArticlesQueryProps): QueryBaseReturnType<GetArticlesReturnType> => {
  const queryResult = useQuery({
    queryKey: [...queryPrefixKey, articleQueryKeys.getArticles, page, limit],
    queryFn: () => getArticles({ page, limit }),
    enabled,
  });

  const {
    isFetching,
    isError,
    error,
    data = {
      articles: [],
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
