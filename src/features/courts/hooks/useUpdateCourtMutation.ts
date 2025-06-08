import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { UpdateCourtDto } from '@/domains/court';
import { updateCourt } from '@/services/court';
import { CourtUpdateReturnType } from '@/services/interfaces';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useUpdateCourtMutation: UseMutationFn<CourtUpdateReturnType, UpdateCourtDto> = (args) => {
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
    mutationFn: updateCourt,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
