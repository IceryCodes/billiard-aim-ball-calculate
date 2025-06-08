'use client';

import { ReactNode, useCallback, useMemo, useState } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { GenderType, getPageUrlByType, PageType } from '@/domains/interface';
import { UserProps, UserUpdateProps } from '@/domains/user';
import { useUserUpdateMutation } from '@/features/user/hooks/useAuthMutation';
import { useDeleteUserMutation } from '@/features/user/hooks/useDeleteUserMutation';
import { useGetMeMutation } from '@/features/user/hooks/useGetMeMutation';
import { Button, ButtonStyleType, defaultButtonStyle } from '@/global-components/buttons/Button';
import { profileValidationSchema } from '@/lib/validation';

import FieldErrorlabel from '../FieldErrorlabel';
import { AutoCompleteType, Input } from '../inputs/Input';
import Popup from '../Popup';
import { ToastStyleType } from '../Toast';

interface ProfileFormProps {
  token: string;
  user: UserProps;
}

export const ProfileForm = ({ token, user }: ProfileFormProps) => {
  const router = useRouter();
  const { showToast } = useToast();

  const { logout, login } = useAuth();
  const { isLoading, mutateAsync: userUpdate } = useUserUpdateMutation();
  const { mutateAsync: userDelete } = useDeleteUserMutation();
  const { mutateAsync: getMe } = useGetMeMutation();

  const [display, setDisplay] = useState<boolean>(false);

  const { control, handleSubmit, reset } = useForm<UserUpdateProps>({
    resolver: yupResolver(profileValidationSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
    },
  });

  const onSubmit = useCallback(
    async (updateData: UserUpdateProps) => {
      if (!token || !user?._id) return;

      const confirmed = window.confirm(`您確定要更新帳號嗎?`);
      if (!confirmed) return;

      try {
        const result = await userUpdate({ ...updateData, _id: user._id.toString() });
        if (typeof result === 'string') throw new Error(result);

        const { token } = await getMe({ _id: user._id });
        if (token) login({ token });

        const { message } = result;
        showToast({ message });

        reset(updateData);
      } catch (error) {
        console.error('Update error:', error);
        showToast({ message: '請重新登入再更新!', toastStyle: ToastStyleType.Warning });
      }
    },
    [getMe, login, reset, showToast, token, user._id, userUpdate]
  );

  const deleteUser = useCallback(async () => {
    if (!user?._id) {
      showToast({ message: '請重新登入', toastStyle: ToastStyleType.Warning });
      router.replace(getPageUrlByType(PageType.LOGIN));
      return;
    }

    const confirmed = window.confirm('您確定要刪除帳號嗎?');
    if (!confirmed) return;

    try {
      const result = await userDelete({ _id: user._id });
      if (typeof result === 'string') throw new Error(result);

      logout();
      router.replace(getPageUrlByType(PageType.LOGIN));
      showToast({ message: result.message, toastStyle: ToastStyleType.Warning });
    } catch (error) {
      console.error('Delete error:', error);
      showToast({ message: '刪除失敗', toastStyle: ToastStyleType.Warning });
    }
  }, [user?._id, userDelete, logout, router, showToast]);

  const form = useMemo(
    (): ReactNode => (
      <Popup title="更新帳號" display={display} onClose={() => setDisplay(false)}>
        <form
          className="max-w-md min-w-96 mx-auto p-12 flex flex-col gap-y-4 bg-backgroundLight rounded-lg shadow-md z-10"
          onSubmit={handleSubmit(onSubmit)}
        >
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

          <Button text={isLoading ? '更新中...' : '更新'} type="submit" disabled={isLoading} className="w-full" />
        </form>
        <Button
          text="刪除"
          onClick={deleteUser}
          buttonStyle={ButtonStyleType.Warning}
          className="transition-all z-0 w-36 -mt-8 mx-auto hover:mt-0"
        />
      </Popup>
    ),
    [display, handleSubmit, onSubmit, control, isLoading, deleteUser]
  );

  const onClick = () => setDisplay(true);

  return (
    <>
      <svg
        onClick={onClick}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-6 h-6 cursor-pointer hover:text-link transition"
      >
        <path d="M3 17.25V21h3.75l11.39-11.39-3.75-3.75L3 17.25zM16 3l5 5-2 2-5-5 2-2z" />
      </svg>
      {form}
    </>
  );
};
