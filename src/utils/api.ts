export const runtime = 'nodejs';
import type { AxiosError, AxiosHeaders, AxiosResponse, CreateAxiosDefaults, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { renewToken } from '@/services/token';

// Extend InternalAxiosRequestConfig to include retryAttempt
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  retryAttempt?: boolean;
}

interface ApiErrorResponse {
  message: string;
  expired?: boolean;
}

export enum ThrowErrorMessage {
  GidRequired = 'Gid is required',
  DateRequired = 'Date is required',
  TokenExpired = 'Token is expired',
}

export enum HttpStatus {
  Ok = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  TooManyRequests = 429,
  InternalServerError = 500,
}

export const logApiError = ({ error, message }: { error: unknown; message: string }) => {
  if (axios.isAxiosError(error) && error.response) {
    console.error(`${HttpStatus[error.response.status]}: ${message}`);
  } else {
    console.error(`Unexpected error: ${error}`);
  }
};

// Base Axios configuration
const axiosBaseConfig: CreateAxiosDefaults = {
  timeout: 80000,
  headers: {
    'Content-Type': 'application/json',
    Accept: '*/*',
  },
};

// Create Axios instances with environment-specific configurations
const apiOrigin = axios.create({
  ...axiosBaseConfig,
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: process.env.NEXT_PUBLIC_HTTPS === 'true', // 添加憑證支持
  validateStatus(status) {
    return status >= 200 && status < 500; // 接受更廣範圍的狀態碼
  },
});

const isBrowser = typeof window !== 'undefined';
const enableAxiosLogs = process.env.NODE_ENV !== 'production';

// Request interceptor
apiOrigin.interceptors.request.use(
  (config: CustomAxiosRequestConfig): CustomAxiosRequestConfig => {
    try {
      if (isBrowser) {
        const token: string | null = localStorage.getItem('token');
        if (!config.headers) config.headers = {} as AxiosHeaders;
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Request Interceptor Error:', error);
      throw error;
    }
  },
  (error: AxiosError) => {
    if (enableAxiosLogs) {
      console.error('Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor
apiOrigin.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (
      error.response?.status === HttpStatus.Unauthorized &&
      (error.response.data as ApiErrorResponse)?.expired &&
      !originalRequest.retryAttempt
    ) {
      originalRequest.retryAttempt = true;

      try {
        const currentToken = localStorage.getItem('token');
        const newToken = await renewToken(currentToken);

        if (newToken) {
          localStorage.setItem('token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiOrigin(originalRequest);
        }
      } catch (renewError) {
        console.error('Renew Token Error:', isBrowser, renewError);
        if (isBrowser) {
          localStorage.removeItem('token');
          window.location.href = getPageUrlByType(PageType.LOGIN);
        }
      }
    }

    return Promise.reject(error);
  }
);

export { apiOrigin };
