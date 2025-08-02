import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { GeocodeAddressDto } from '@/domains/court';
import { geocodeAddress } from '@/services/court';
import { GeocodeAddressReturnType } from '@/services/interfaces';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useGeocodeAddressMutation: UseMutationFn<GeocodeAddressReturnType, GeocodeAddressDto> = (args) => {
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
    mutationFn: geocodeAddress,
    onSuccess,
    onError,
  });

  return useMemo(() => {
    return { isLoading, isError, error, data, mutate, mutateAsync };
  }, [isLoading, isError, error, data, mutate, mutateAsync]);
};
