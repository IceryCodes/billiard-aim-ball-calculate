import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { GetUserDto } from '@/domains/user';
import { UserLoginReturnType } from '@/services/interfaces';
import { getMe } from '@/services/user';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useGetMeMutation: UseMutationFn<UserLoginReturnType, GetUserDto> = (args) => {
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
    mutationFn: getMe,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
