import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { DeleteCourtDto } from '@/domains/court';
import { deleteCourt } from '@/services/court';
import { CourtUpdateReturnType } from '@/services/interfaces';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useDeleteCourtMutation: UseMutationFn<CourtUpdateReturnType, DeleteCourtDto> = (args) => {
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
    mutationFn: deleteCourt,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
