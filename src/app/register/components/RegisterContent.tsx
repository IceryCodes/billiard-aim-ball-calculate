'use client';

import { ReactNode, useEffect } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { GenderType } from '@/domains/interface';
import { UserRegisterDto } from '@/domains/user';
import { useUserRegisterMutation } from '@/features/user/hooks/useAuthMutation';
import { Button, defaultButtonStyle } from '@/global-components/buttons/Button';
import FieldErrorlabel from '@/global-components/FieldErrorlabel';
import { AutoCompleteType, Input, InputStyleType } from '@/global-components/inputs/Input';
import { ToastStyleType } from '@/global-components/Toast';
import { registerValidationSchema } from '@/lib/validation';

const RegisterContent = (): ReactNode => {
  const router = useRouter();
  const { login, logout } = useAuth();
  const { showToast } = useToast();

  const { control, handleSubmit, reset } = useForm<UserRegisterDto>({
    resolver: yupResolver(registerValidationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      gender: GenderType.None,
    },
  });
  const { isLoading, mutateAsync } = useUserRegisterMutation();

  const handleRegister = async (data: UserRegisterDto) => {
    const confirmed = window.confirm(`您確定要註冊帳號嗎?`);
    if (!confirmed) return;

    try {
      const result = await mutateAsync({ ...data, email: data.email.toLowerCase() });
      if (typeof result === 'string') throw new Error(result);

      const { token, message } = result;
      if (token) {
        login({ token });
        router.push(process.env.NEXT_PUBLIC_BASE_URL);
        showToast({ message });
      } else {
        logout();
        if (message) showToast({ message, toastStyle: ToastStyleType.Warning });
      }

      reset();
    } catch (error) {
      console.error('Mutation error:', error);
    }
  };

  useEffect(() => logout(), [logout]);

  return (
    <form
      onSubmit={handleSubmit(handleRegister)}
      className="max-w-md min-w-96 mx-auto p-4 flex flex-col gap-y-4 bg-backgroundLight rounded-lg shadow-md"
    >
      <h2 className="text-2xl font-bold text-center">註冊</h2>

      <div className="flex justify-around gap-x-2">
        <Controller
          name="firstName"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <div>
              <Input {...field} placeholder="名字" autoComplete={AutoCompleteType.GivenName} required />
              <FieldErrorlabel error={error} />
            </div>
          )}
        />

        <Controller
          name="lastName"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <div>
              <Input {...field} placeholder="姓氏" autoComplete={AutoCompleteType.FamilyName} required />
              <FieldErrorlabel error={error} />
            </div>
          )}
        />
      </div>

      <Controller
        name="gender"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <div>
            <div className="flex justify-around gap-x-2">
              <Button
                element={<>男</>}
                onClick={() => field.onChange(GenderType.Male)}
                className={`${defaultButtonStyle} w-full p-2 border rounded-md ${field.value === GenderType.Male ? 'bg-link text-background' : 'bg-backgroundLight'}`}
              />
              <Button
                element={<>女</>}
                onClick={() => field.onChange(GenderType.Female)}
                className={`${defaultButtonStyle} w-full p-2 border rounded-md ${field.value === GenderType.Female ? 'bg-link text-background' : 'bg-backgroundLight'}`}
              />
            </div>
            <FieldErrorlabel error={error} />
          </div>
        )}
      />

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

      <Button text={isLoading ? '註冊中...' : '註冊'} type="submit" disabled={isLoading} className="w-full" />
    </form>
  );
};

export default RegisterContent;
