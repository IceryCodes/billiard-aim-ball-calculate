import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { UpdateTournamentDto } from '@/domains/tournament';
import { TournamentUpdateReturnType } from '@/services/interfaces';
import { updateTournament } from '@/services/tournament';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useUpdateTournamentMutation: UseMutationFn<TournamentUpdateReturnType, UpdateTournamentDto> = (args) => {
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
    mutationFn: updateTournament,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
