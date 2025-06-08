import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { CreateManageDto } from '@/domains/manage';
import { ManageUpdateReturnType } from '@/services/interfaces';
import { updateManages } from '@/services/manage';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useUpdateManagesMutation: UseMutationFn<ManageUpdateReturnType, CreateManageDto> = (args) => {
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
    mutationFn: updateManages,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
