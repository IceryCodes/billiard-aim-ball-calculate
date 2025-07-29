import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { GenerateFromCacheDto } from '@/domains/article';
import { generateArticlesFromCache } from '@/services/article';
import { GenerateFromCacheReturnType } from '@/services/interfaces';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useGenerateFromCacheMutation: UseMutationFn<GenerateFromCacheReturnType, GenerateFromCacheDto> = (args) => {
  const { onError, onSuccess, mutationPrefixKey = [] } = args ?? {};
  const {
    isPending: isLoading,
    isError,
    error,
    data,
    mutate,
    mutateAsync,
  } = useMutation({
    mutationKey: [...mutationPrefixKey, 'generateFromCache'],
    mutationFn: generateArticlesFromCache,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
