import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { GetCourtsMapDto } from '@/domains/court';
import { getCourtsMap } from '@/services/court';
import { GetCourtsReturnType } from '@/services/interfaces';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useCourtsMapMutation: UseMutationFn<GetCourtsReturnType, GetCourtsMapDto> = (args) => {
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
    mutationFn: getCourtsMap,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
