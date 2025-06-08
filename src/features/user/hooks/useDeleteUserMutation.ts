import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { DeleteUserDto } from '@/domains/user';
import { UserUpdateReturnType } from '@/services/interfaces';
import { deleteUser } from '@/services/user';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useDeleteUserMutation: UseMutationFn<UserUpdateReturnType, DeleteUserDto> = (args) => {
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
    mutationFn: deleteUser,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
