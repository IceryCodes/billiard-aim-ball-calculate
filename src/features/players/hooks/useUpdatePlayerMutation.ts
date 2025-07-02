import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { UpdatePlayerDto } from '@/domains/player';
import { PlayerUpdateReturnType } from '@/services/interfaces';
import { updatePlayer } from '@/services/player';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useUpdatePlayerMutation: UseMutationFn<PlayerUpdateReturnType, UpdatePlayerDto> = (args) => {
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
    mutationFn: updatePlayer,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
