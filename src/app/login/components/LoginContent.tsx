'use client';

import { ReactNode, useEffect } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { UserLoginDto } from '@/domains/user';
import { useUserLoginMutation } from '@/features/user/hooks/useAuthMutation';
import { Button } from '@/global-components/buttons/Button';
import FieldErrorlabel from '@/global-components/FieldErrorlabel';
import { AutoCompleteType, Input, InputStyleType } from '@/global-components/inputs/Input';
import { ToastStyleType } from '@/global-components/Toast';
import { loginValidationSchema } from '@/lib/validation';

const LoginContent = (): ReactNode => {
  const router = useRouter();
  const { control, handleSubmit, reset } = useForm<UserLoginDto>({
    resolver: yupResolver(loginValidationSchema),
    defaultValues: { email: '', password: '' },
  });
  const { isLoading, mutateAsync } = useUserLoginMutation();
  const { login, logout } = useAuth();
  const { showToast } = useToast();

  const handleLogin = async (data: UserLoginDto) => {
    try {
      const result = await mutateAsync({ ...data, email: data.email.toLowerCase() });
      if (typeof result === 'string') throw new Error(result);

      const { token, message } = result;
      if (token) {
        login({ token });
        router.push(process.env.NEXT_PUBLIC_BASE_URL);
      } else {
        logout();
        if (message) showToast({ message, toastStyle: ToastStyleType.Warning });
      }

      reset();
    } catch (error) {
      console.error('LoginContent error:', error);
    }
  };

  useEffect(() => logout(), [logout]);

  return (
    <form
      onSubmit={handleSubmit(handleLogin)}
      className="max-w-md min-w-96 mx-auto p-4 flex flex-col gap-y-4 bg-backgroundLight rounded-lg shadow-md"
    >
      <h2 className="text-2xl font-bold text-center">登入</h2>
      <Controller
        name="email"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <div>
            <Input
              type={InputStyleType.Email}
              {...field}
              placeholder="信箱"
              autoComplete={AutoCompleteType.Email}
              required
            />
            <FieldErrorlabel error={error} />
          </div>
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <div>
            <Input
              type={InputStyleType.Password}
              {...field}
              placeholder="密碼"
              autoComplete={AutoCompleteType.CurrentPassword}
              required
            />
            <FieldErrorlabel error={error} />
          </div>
        )}
      />

      <Button text={isLoading ? '登入中...' : '登入'} type="submit" disabled={isLoading} className="w-full" />
    </form>
  );
};

export default LoginContent;
