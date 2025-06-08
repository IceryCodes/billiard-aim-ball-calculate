import { useEffect, useMemo, useRef } from 'react';

import type { UseQueryResult } from '@tanstack/react-query';

type UseQueryCallbackProps<ResponseData, ResponseError> = UseQueryResult<ResponseData, ResponseError> & {
  onSuccess?: (data: ResponseData) => void;
  onError?: (error: ResponseError) => void;
};

export const useQueryCallback = <ResponseData, ResponseError>({
  dataUpdatedAt,
  errorUpdatedAt,
  isFetchedAfterMount,
  isFetching,
  isError,
  data,
  error,
  onSuccess,
  onError,
}: UseQueryCallbackProps<ResponseData, ResponseError>): void => {
  const comparedDataUpdatedAtRef = useRef<number>(dataUpdatedAt);
  const comparedErrorUpdatedAtRef = useRef<number>(errorUpdatedAt);

  const isProcessCallbackBaseConditionFailed = useMemo<boolean>(() => {
    return !isFetchedAfterMount || isFetching;
  }, [isFetchedAfterMount, isFetching]);

  useEffect(() => {
    if (
      isProcessCallbackBaseConditionFailed ||
      !onError ||
      !isError ||
      errorUpdatedAt === 0 ||
      errorUpdatedAt === comparedErrorUpdatedAtRef.current
    )
      return;

    comparedErrorUpdatedAtRef.current = errorUpdatedAt;
    onError(error);
  }, [isError, onError, error, isProcessCallbackBaseConditionFailed, errorUpdatedAt]);

  useEffect(() => {
    if (
      isProcessCallbackBaseConditionFailed ||
      !onSuccess ||
      data === undefined ||
      dataUpdatedAt === 0 ||
      dataUpdatedAt === comparedDataUpdatedAtRef.current
    )
      return;

    comparedDataUpdatedAtRef.current = dataUpdatedAt;
    onSuccess(data);
  }, [isProcessCallbackBaseConditionFailed, onSuccess, data, dataUpdatedAt]);
};
