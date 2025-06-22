'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import { notFound, useParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { CreateTournamentProps, TournamentProps } from '@/domains/tournament';
import { useCourtQuery } from '@/features/courts/hooks/useCourtQuery';
import { useCreateTournamentMutation } from '@/features/tournaments/hooks/useCreateTournamentMutation';
import { useUpdateTournamentMutation } from '@/features/tournaments/hooks/useUpdateTournamentMutation';
import { Button } from '@/global-components/buttons/Button';
import { tournamentValidationSchema } from '@/lib/validation';

import FieldErrorlabel from '../FieldErrorlabel';
import { FormField } from '../formFields/FormFields';
import Popup from '../Popup';
import { TextArea } from '../textareas/TextArea';

export enum TournamentFormMode {
  Create = 'create',
  Edit = 'edit',
}

interface TournamentFormProps {
  mode: TournamentFormMode;
  tournament?: TournamentProps;
  onSuccess?: () => void;
}

const defaultTournament: CreateTournamentProps = {
  title: '',
  excerpt: '',
  content: '',
  customLink: '',
  court: '',
  courtTitle: '',
  courtCustomLink: '',
};

export const TournamentForm = ({ mode, tournament, onSuccess }: TournamentFormProps) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const params = useParams();
  const courtCustomLink: string = params?.courtCustomLink as string;

  const {
    data: { court } = {},
    isLoading,
    isError,
  } = useCourtQuery({ customLink: courtCustomLink, enabled: !!courtCustomLink });
  const { mutateAsync: createTournament, isLoading: isCreateLoading } = useCreateTournamentMutation();
  const { mutateAsync: updateTournament, isLoading: isUpdateLoading } = useUpdateTournamentMutation();

  const [display, setDisplay] = useState<boolean>(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = useForm<CreateTournamentProps>({
    resolver: yupResolver(tournamentValidationSchema),
    defaultValues: mode === TournamentFormMode.Create ? defaultTournament : tournament,
  });

  const messageArray = useMemo((): string[] => {
    return Object.values(errors).flatMap((error) => (Array.isArray(error) ? error.map((e) => e.message) : [error.message]));
  }, [errors]);

  const onSubmit = useCallback(
    async (data: CreateTournamentProps) => {
      const action = mode === TournamentFormMode.Create ? '新增' : '更新';
      const confirmed = window.confirm(`您確定要${action}${data.title}嗎?`);
      if (!confirmed || !user) return;

      const formattedData = { ...data };
      if (court) {
        formattedData.court = court._id;
        formattedData.courtTitle = court.title;
        formattedData.courtCustomLink = court.customLink;
      }

      try {
        const result =
          mode === TournamentFormMode.Edit && tournament
            ? await updateTournament({
                ...formattedData,
                ...tournament,
              })
            : await createTournament(formattedData);

        if (typeof result === 'string') throw new Error(result);

        const { message } = result;
        if (message) showToast({ message });

        reset(formattedData);
        setDisplay(false);

        if (onSuccess) onSuccess();
      } catch (error) {
        console.error(`${mode} error:`, error);
      }
    },
    [mode, user, court, tournament, updateTournament, createTournament, showToast, reset, onSuccess]
  );

  const form = useMemo(
    (): ReactNode => (
      <Popup
        title={mode === TournamentFormMode.Create ? '新增球場賽程' : '編輯球場賽程'}
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
              text={mode === TournamentFormMode.Create ? '新增' : '更新'}
              disabled={!isDirty || isCreateLoading || isUpdateLoading}
            />
          </div>

          <FormField control={control} titleText="球場賽程" fieldName="title" placeholder="球場賽程名稱" col={6} />

          <FormField
            control={control}
            titleText="自訂網址名稱"
            fieldName="customLink"
            placeholder={tournament?.customLink || '付費功能😜'}
            col={6}
            disabled
          />

          <div className="flex flex-col col-span-6">
            <label>簡述</label>
            <Controller
              name="excerpt"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <TextArea {...field} placeholder="球場賽程的簡述" className="h-20" />
                  <FieldErrorlabel error={error} />
                </>
              )}
            />
          </div>

          <div className="flex flex-col col-span-6">
            <label>內容</label>
            <Controller
              name="content"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <TextArea {...field} placeholder="球場賽程的詳細內容" />
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
      tournament?.customLink,
    ]
  );

  useEffect(() => {
    if (!isLoading && !court && !isError) notFound();
  }, [isLoading, court, isError]);

  if (isLoading) return <></>;
  if (isError) return <></>;
  if (!court) return <></>;

  return (
    <>
      <svg
        onClick={() => setDisplay(true)}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-6 h-6 cursor-pointer hover:text-link transition"
      >
        {mode === TournamentFormMode.Create ? (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </>
        ) : (
          <path d="M3 17.25V21h3.75l11.39-11.39-3.75-3.75L3 17.25zM16 3l5 5-2 2-5-5 2-2z" />
        )}
      </svg>

      {/* 簡化的 form，移除 useMemo */}
      {form}
    </>
  );
};
