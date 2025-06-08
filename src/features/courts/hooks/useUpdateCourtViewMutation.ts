import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { UpdateCourtViewDto } from '@/domains/court';
import { updateCourtView } from '@/services/court';
import { CourtUpdateReturnType } from '@/services/interfaces';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useUpdateCourtViewMutation: UseMutationFn<CourtUpdateReturnType, UpdateCourtViewDto> = (args) => {
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
    mutationFn: updateCourtView,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
