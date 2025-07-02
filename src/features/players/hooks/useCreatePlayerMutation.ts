import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { CreatePlayerDto } from '@/domains/player';
import { PlayerUpdateReturnType } from '@/services/interfaces';
import { createPlayer } from '@/services/player';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useCreatePlayerMutation: UseMutationFn<PlayerUpdateReturnType, CreatePlayerDto> = (args) => {
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
    mutationFn: createPlayer,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
