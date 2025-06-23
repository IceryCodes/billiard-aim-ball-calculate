import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { CreateTournamentProps } from '@/domains/tournament';
import { TournamentUpdateReturnType } from '@/services/interfaces';
import { createTournament } from '@/services/tournament';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useCreateTournamentMutation: UseMutationFn<TournamentUpdateReturnType, CreateTournamentProps> = (args) => {
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
    mutationFn: createTournament,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
