import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { GetGoogleInfosDto } from '@/domains/google';
import { getGoogleInfos } from '@/services/google';
import { GetGoogleInfosReturnType } from '@/services/interfaces';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useGoogleInfosMutation: UseMutationFn<GetGoogleInfosReturnType, GetGoogleInfosDto> = (args) => {
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
    mutationFn: getGoogleInfos,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
