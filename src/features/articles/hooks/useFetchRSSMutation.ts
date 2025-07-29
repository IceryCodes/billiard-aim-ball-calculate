import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { fetchRSSNews } from '@/services/article';
import { FetchRSSReturnType } from '@/services/interfaces';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useFetchRSSMutation: UseMutationFn<FetchRSSReturnType, void> = (args) => {
  const { onError, onSuccess, mutationPrefixKey = [] } = args ?? {};
  const {
    isPending: isLoading,
    isError,
    error,
    data,
    mutate,
    mutateAsync,
  } = useMutation({
    mutationKey: [...mutationPrefixKey, 'fetchRSS'],
    mutationFn: fetchRSSNews,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
