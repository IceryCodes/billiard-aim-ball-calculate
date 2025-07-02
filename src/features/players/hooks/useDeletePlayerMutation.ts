import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { DeletePlayerDto } from '@/domains/player';
import { PlayerUpdateReturnType } from '@/services/interfaces';
import { deletePlayer } from '@/services/player';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useDeletePlayerMutation: UseMutationFn<PlayerUpdateReturnType, DeletePlayerDto> = (args) => {
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
    mutationFn: deletePlayer,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
