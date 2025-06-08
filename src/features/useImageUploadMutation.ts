import { useMemo } from 'react';

import { useMutation } from '@tanstack/react-query';

import { ImageUploadDto } from '@/domains/image';
import { uploadImage } from '@/services/image';
import { ImageUploadReturnType } from '@/services/interfaces';
import type { UseMutationFn } from '@/utils/reactQuery';

export const useImageUploadMutation: UseMutationFn<ImageUploadReturnType, ImageUploadDto> = (args) => {
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
    mutationFn: uploadImage,
    onSuccess,
    onError,
  });

  return useMemo(
    () => ({
      isLoading,
      isError,
      error,
      data,
      mutate,
      mutateAsync,
    }),
    [isLoading, isError, error, data, mutate, mutateAsync]
  );
};
