import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { GenerateArticleDto } from '@/domains/article';
import { generateArticle } from '@/services/article';
import { GenerateArticleReturnType } from '@/services/interfaces';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useArticleGenerateMutation: UseMutationFn<GenerateArticleReturnType, GenerateArticleDto> = (args) => {
  const { onError, onSuccess, mutationPrefixKey = [] } = args ?? {};
  const {
    isPending: isLoading,
    isError,
    error,
    data,
    mutate,
    mutateAsync,
  } = useMutation({
    mutationKey: [...mutationPrefixKey],
    mutationFn: generateArticle,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
