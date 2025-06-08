import type {
  UseBaseMutationResult,
  UseBaseQueryOptions,
  UseBaseQueryResult,
  UseMutationOptions,
} from '@tanstack/react-query';

export interface QueryBaseProps<ResponseData> {
  onError?: (error: unknown) => void;
  onSuccess?: (data?: ResponseData) => void;
  enabled?: UseBaseQueryOptions<ResponseData>['enabled'];
  keepPreviousData?: boolean;
  refetchOnWindowFocus?: boolean;
  queryPrefixKey?: readonly unknown[];
}

export interface QueryBaseReturnType<ResponseData> {
  isLoading: UseBaseQueryResult['isFetching'];
  isError: UseBaseQueryResult['isError'];
  error: UseBaseQueryResult['error'];
  refetch: UseBaseQueryResult['refetch'];
  data: ResponseData extends unknown[] ? ResponseData : UseBaseQueryResult<ResponseData>['data'];
}

export interface MutateBaseProps<ResponseData, MutateProps = void> {
  onSuccess?: UseMutationOptions<ResponseData, unknown, MutateProps, unknown>['onSuccess'];
  onError?: UseMutationOptions<ResponseData, Error, MutateProps, unknown>['onError'];
  onSettled?: UseMutationOptions<ResponseData, unknown, MutateProps, unknown>['onSettled'];
  mutationPrefixKey?: readonly unknown[];
}

export interface MutateBaseReturnType<ResponseData, MutateProps = void> {
  isLoading: UseBaseMutationResult['isPending'];
  isError: UseBaseMutationResult['isError'];
  error: UseBaseMutationResult['error'];
  data: UseBaseMutationResult<ResponseData>['data'];
  mutate: UseBaseMutationResult<ResponseData, unknown, MutateProps, unknown>['mutate'];
  mutateAsync: UseBaseMutationResult<ResponseData, unknown, MutateProps, unknown>['mutateAsync'];
}

export type UseMutationFn<ResponseData, MutateProps> = (
  props?: MutateBaseProps<ResponseData, MutateProps>
) => MutateBaseReturnType<ResponseData, MutateProps>;
