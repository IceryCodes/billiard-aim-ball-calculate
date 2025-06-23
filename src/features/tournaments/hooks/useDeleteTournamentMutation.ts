import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { DeleteTournamentDto } from '@/domains/tournament';
import { TournamentUpdateReturnType } from '@/services/interfaces';
import { deleteTournament } from '@/services/tournament';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useDeleteTournamentMutation: UseMutationFn<TournamentUpdateReturnType, DeleteTournamentDto> = (args) => {
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
    mutationFn: deleteTournament,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
