import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { GetArticleDto } from '@/domains/article';
import { useQueryCallback } from '@/hooks/utils/useQueryCallback';
import { articleQueryKeys, getArticle } from '@/services/article';
import { GetArticleReturnType } from '@/services/interfaces';
import { QueryBaseProps, QueryBaseReturnType } from '@/utils/reactQuery';

interface UseArticleQueryProps extends QueryBaseProps<GetArticleReturnType>, GetArticleDto {}

export const useArticleQuery = ({
  onSuccess,
  onError,
  enabled,
  queryPrefixKey = [],
  customLink,
}: UseArticleQueryProps): QueryBaseReturnType<GetArticleReturnType> => {
  const queryResult = useQuery({
    queryKey: [...queryPrefixKey, articleQueryKeys.getArticle, customLink],
    queryFn: () => getArticle({ customLink }),
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
