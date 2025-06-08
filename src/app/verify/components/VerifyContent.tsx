'use client';

import { useEffect, useState } from 'react';

import { notFound, useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { useUserVerifyQuery } from '@/features/user/hooks/useUserVerifyQuery';
import { ToastStyleType } from '@/global-components/Toast';

const VerifyContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [countdown, setCountdown] = useState<number>(5); // Set initial countdown to 5 seconds

  const token: string | null = searchParams ? searchParams.get('token') : null;

  if (!token) notFound();

  const { data, isLoading, isError, error } = useUserVerifyQuery({
    token,
    enabled: !!token,
  });

  useEffect(() => {
    if (data?.message) showToast({ message: data?.message });
    if (isError) showToast({ message: `${error?.message}`, toastStyle: ToastStyleType.Warning });
    logout();

    // Start countdown and redirect after 5 seconds
    const intervalId: NodeJS.Timeout = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : prev));
    }, 1000);

    const timeoutId: NodeJS.Timeout = setTimeout(() => {
      router.push(getPageUrlByType(PageType.LOGIN));
    }, 5000);

    // Cleanup interval and timeout on component unmount
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [data, isError, error, showToast, logout, router]);

  if (isLoading) return <div>驗證帳號中...</div>;

  return (
    <div className="flex flex-col gap-y-2 text-center">
      <span>{data?.message ?? error?.message}</span>
      <span>{countdown} 秒後進行跳轉...</span>
    </div>
  );
};

export default VerifyContent;
