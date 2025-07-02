'use client';

import { ReactNode, useCallback, useMemo, useState } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { CountyType, districtOptions, GenderType, PageType } from '@/domains/interface';
import { PlayerProps, UpdatePlayerProps } from '@/domains/player';
import { GameTypesType } from '@/domains/tournament';
import { useCreatePlayerMutation } from '@/features/players/hooks/useCreatePlayerMutation';
import { useUpdatePlayerMutation } from '@/features/players/hooks/useUpdatePlayerMutation';
import { useGetMeMutation } from '@/features/user/hooks/useGetMeMutation';
import { playerValidationSchema } from '@/lib/validation';
import { verifyToken } from '@/utils/token';

import { Button, defaultButtonStyle } from '../buttons/Button';
import FieldErrorlabel from '../FieldErrorlabel';
import { FormField } from '../formFields/FormFields';
import { AutoCompleteType, Input, InputStyleType } from '../inputs/Input';
import Popup from '../Popup';
import { Select } from '../selects/Select';
import { TextArea } from '../textareas/TextArea';
import { ToastStyleType } from '../Toast';

export enum PlayerFormMode {
  Create = 'create',
  Edit = 'edit',
}

interface PlayerFormProps {
  mode: PlayerFormMode;
  player?: PlayerProps;
  onSuccess?: () => void;
}

const defaultPlayer: UpdatePlayerProps = {
  partner: false,
  owner: '',
  gender: GenderType.None,
  websiteUrl: '',
  email: '',
  phone: '',
  county: '' as CountyType,
  district: '',
  title: '',
  excerpt: '',
  content: '',
  keywords: [],
  featuredImg: '',
  customLink: '',
  gameTypes: [],
  professional: false,
  licenses: [],
};

export const PlayerForm = ({ mode, player, onSuccess }: PlayerFormProps) => {
  const { user, token, login, logout } = useAuth();
  const { showToast } = useToast();

  const { mutateAsync: createPlayer, isLoading: isCreateLoading } = useCreatePlayerMutation();
  const { mutateAsync: updatePlayer, isLoading: isUpdateLoading } = useUpdatePlayerMutation({
    onSuccess,
  });
  const { mutateAsync: getMe } = useGetMeMutation();

  const [display, setDisplay] = useState<boolean>(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, errors },
  } = useForm<UpdatePlayerProps>({
    resolver: yupResolver(playerValidationSchema),
    defaultValues: mode === PlayerFormMode.Create ? defaultPlayer : player,
  });

  const messageArray = useMemo((): string[] => {
    return Object.values(errors).flatMap((error) => (Array.isArray(error) ? error.map((e) => e.message) : [error.message]));
  }, [errors]);

  const county = watch('county');

  const onSubmit = useCallback(
    async (data: UpdatePlayerProps) => {
      const action = mode === PlayerFormMode.Create ? '新增' : '更新';
      const confirmed = window.confirm(`您確定要${action}${data.title}嗎?`);
      if (!confirmed || !user) return;

      try {
        const processedData = { ...data };

        const result =
          mode === PlayerFormMode.Create
            ? await createPlayer(processedData)
            : player?._id &&
              (await updatePlayer({
                _id: player._id,
                ...processedData,
              }));

        if (typeof result === 'string' || !result) throw new Error(result);

        const { message } = result;
        if (message) showToast({ message });

        reset(data);
        setDisplay(false);

        if (onSuccess) onSuccess();

        // 如果是新增模式且有 user，更新用戶資訊
        if (mode === PlayerFormMode.Create && user) {
          const { token } = await getMe({ _id: user._id });
          if (token) login({ token });
        }
      } catch (error) {
        console.error(`${mode} error:`, error);
      }
    },
    [mode, createPlayer, updatePlayer, player, user, getMe, login, reset, showToast, onSuccess]
  );

  const form = useMemo(
    (): ReactNode => (
      <Popup
        title={`${mode === PlayerFormMode.Create ? '新增' : '編輯'}${PageType.PLAYERS}`}
        display={display}
        onClose={() => setDisplay(false)}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-6 gap-4 w-[500px]">
          <div className="flex flex-col col-span-3 justify-center">
            {messageArray.length > 0 &&
              messageArray.map((message, index) => (
                <label key={index} className="text-red-500 text-[12px]">
                  {message}
                </label>
              ))}
          </div>

          <div className="flex justify-end col-span-3 items-center">
            <Button
              type="submit"
              text={mode === PlayerFormMode.Create ? '新增' : '更新'}
              disabled={!isDirty || isCreateLoading || isUpdateLoading}
            />
          </div>

          <FormField
            control={control}
            titleText={PageType.PLAYERS}
            fieldName="title"
            placeholder={`${PageType.PLAYERS}名稱`}
            col={6}
          />

          <Controller
            name="partner"
            control={control}
            render={({ field: { onChange, value } }) => (
              <div className="flex items-center col-span-3">
                <Input type={InputStyleType.Checkbox} checked={value} onChange={(e) => onChange(e.target.checked)} />
                <label className="text-sm">{`${process.env.NEXT_PUBLIC_SITENAME}合作夥伴`}</label>
              </div>
            )}
          />

          <Controller
            name="professional"
            control={control}
            render={({ field: { onChange, value } }) => (
              <div className="flex items-center col-span-3">
                <Input type={InputStyleType.Checkbox} checked={value} onChange={(e) => onChange(e.target.checked)} />
                <label className="text-sm">職業選手</label>
              </div>
            )}
          />

          <div className="flex flex-col col-span-3">
            <label>縣市</label>
            <Controller
              name="county"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Select {...field} defaultValue="所有縣市" options={Object.values(CountyType)} />
                  <FieldErrorlabel error={error} />
                </>
              )}
            />
          </div>

          <div className="flex flex-col col-span-3">
            <label>地區</label>
            <Controller
              name="district"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Select {...field} defaultValue="所有地區" options={Object.values(districtOptions[county] ?? {})} />
                  <FieldErrorlabel error={error} />
                </>
              )}
            />
          </div>

          <div className="flex flex-col col-span-3">
            <label>{PageType.PLAYERS}性別</label>
            <Controller
              name="gender"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <div>
                  <div className="flex justify-around gap-x-2">
                    <Button
                      element={<>男</>}
                      onClick={() => field.onChange(GenderType.Male)}
                      className={`${defaultButtonStyle} w-full p-2 border rounded-md ${
                        field.value === GenderType.Male ? 'bg-link text-background' : 'bg-backgroundLight'
                      }`}
                    />
                    <Button
                      element={<>女</>}
                      onClick={() => field.onChange(GenderType.Female)}
                      className={`${defaultButtonStyle} w-full p-2 border rounded-md ${
                        field.value === GenderType.Female ? 'bg-link text-background' : 'bg-backgroundLight'
                      }`}
                    />
                  </div>
                  <FieldErrorlabel error={error} />
                </div>
              )}
            />
          </div>

          <FormField
            control={control}
            titleText="自訂網址名稱"
            fieldName="customLink"
            placeholder={player?.customLink || '付費功能😜'}
            col={3}
            disabled
          />

          <div className="flex flex-col col-span-6">
            <label>擅長項目</label>
            <Controller
              name="gameTypes"
              control={control}
              render={({ field: { onChange, value } }) => (
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(GameTypesType)
                    .sort((a, b) => a.length - b.length)
                    .map((game) => (
                      <label key={game} className="flex items-center">
                        <Input
                          type={InputStyleType.Checkbox}
                          value={game}
                          checked={value?.includes(game)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            const updatedPets = isChecked
                              ? [...(value || []), game]
                              : value?.filter((d) => d !== game) || [];
                            onChange(updatedPets);
                          }}
                        />
                        {game}
                      </label>
                    ))}
                </div>
              )}
            />
          </div>

          <FormField
            control={control}
            type={InputStyleType.Url}
            titleText="個人網站"
            fieldName="websiteUrl"
            placeholder={process.env.NEXT_PUBLIC_BASE_URL}
            col={6}
          />

          <FormField
            control={control}
            type={InputStyleType.Tel}
            titleText="電話"
            fieldName="phone"
            placeholder="聯絡電話"
            col={3}
          />
          <FormField
            control={control}
            type={InputStyleType.Email}
            titleText="信箱"
            fieldName="email"
            placeholder="聯絡信箱"
            col={3}
            autoComplete={AutoCompleteType.Email}
          />

          <FormField
            control={control}
            titleText="簡述"
            fieldName="excerpt"
            placeholder={`${PageType.PLAYERS}的簡述`}
            col={6}
          />

          <div className="flex flex-col col-span-6">
            <label>內容</label>
            <Controller
              name="content"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <TextArea {...field} placeholder={`${PageType.PLAYERS}的詳細內容`} />
                  <FieldErrorlabel error={error} />
                </>
              )}
            />
          </div>
        </form>
      </Popup>
    ),
    [
      mode,
      display,
      handleSubmit,
      onSubmit,
      messageArray,
      isDirty,
      isCreateLoading,
      isUpdateLoading,
      control,
      player?.customLink,
      county,
    ]
  );

  const onClick = useCallback(async () => {
    if (!token) {
      alert('請重新登入');
      return logout();
    }
    const {
      manage: { players },
    } = await verifyToken({ token });

    if (players.length > 0 && mode === PlayerFormMode.Create) {
      return showToast({ message: `您目前只能管理一名${PageType.PLAYERS}`, toastStyle: ToastStyleType.Normal });
    }

    setDisplay(true);
  }, [logout, mode, showToast, token]);

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
        {mode === PlayerFormMode.Create ? (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </>
        ) : (
          <path d="M3 17.25V21h3.75l11.39-11.39-3.75-3.75L3 17.25zM16 3l5 5-2 2-5-5 2-2z" />
        )}
      </svg>
      {display && form}
    </>
  );
};
