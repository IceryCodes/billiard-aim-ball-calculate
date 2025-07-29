import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { generateArticlesTwoStep } from '@/services/article';
import { GenerateFromCacheReturnType } from '@/services/interfaces';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useArticleTwoStepMutation: UseMutationFn<GenerateFromCacheReturnType, void> = (args) => {
  const { onError, onSuccess, mutationPrefixKey = [] } = args ?? {};
  const {
    isPending: isLoading,
    isError,
    error,
    data,
    mutate,
    mutateAsync,
  } = useMutation({
    mutationKey: [...mutationPrefixKey, 'articleTwoStep'],
    mutationFn: generateArticlesTwoStep,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
