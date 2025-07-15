'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import moment from 'moment';
import { notFound, useParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { CreateTournamentProps, GamerCountType, TournamentProps, TournamentType } from '@/domains/tournament';
import { useCourtQuery } from '@/features/courts/hooks/useCourtQuery';
import { useCreateTournamentMutation } from '@/features/tournaments/hooks/useCreateTournamentMutation';
import { useUpdateTournamentMutation } from '@/features/tournaments/hooks/useUpdateTournamentMutation';
import { Button } from '@/global-components/buttons/Button';
import { useEnum } from '@/hooks/utils/useEnum';
import { tournamentValidationSchema } from '@/lib/validation';

import FieldErrorlabel from '../FieldErrorlabel';
import { FormField } from '../formFields/FormFields';
import { ImageUpload } from '../images/ImageUpload';
import { Input, InputStyleType } from '../inputs/Input';
import Popup from '../Popup';
import { Select } from '../selects/Select';
import { TextArea } from '../textareas/TextArea';

export enum TournamentFormMode {
  Create = 'create',
  Edit = 'edit',
}

interface TournamentFormProps {
  mode: TournamentFormMode;
  title?: string;
  tournament?: TournamentProps;
  onSuccess?: () => void;
}

// 表單資料結構，符合驗證 schema
interface TournamentFormData {
  title: string;
  featuredImg: string;
  excerpt: string;
  content: string;
  customLink: string;
  court: string;
  courtTitle: string;
  courtCustomLink: string;
  gamerCount: GamerCountType;
  tournament: {
    tournamentDate: Date;
    tournamentDeadlineDate: Date;
    tournamentType: TournamentType;
    tournamentFee: number;
    prizeFirst: number;
    prizeSecond: number;
    prizeThird: number;
    contactName: string;
    contactPhone: string;
    defaultGames: number;
  };
}

// 移除自定義錯誤類型，使用 react-hook-form 的內建類型

const defaultTournament: TournamentFormData = {
  title: '',
  featuredImg: '',
  excerpt: '',
  content: '',
  customLink: '',
  court: '',
  courtTitle: '',
  courtCustomLink: '',
  gamerCount: GamerCountType.THIRTY_TWO,
  tournament: {
    tournamentDate: new Date(),
    tournamentDeadlineDate: new Date(),
    tournamentType: TournamentType.SINGLE,
    tournamentFee: 0,
    prizeFirst: 0,
    prizeSecond: 0,
    prizeThird: 0,
    contactName: '',
    contactPhone: '',
    defaultGames: 7,
  },
};

export const TournamentFormButton = ({ mode, title, tournament, onSuccess }: TournamentFormProps) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const params = useParams();
  const courtCustomLink: string = params?.courtCustomLink as string;

  const { composeTournamentType } = useEnum();

  const {
    data: { court } = {},
    isLoading,
    isError,
  } = useCourtQuery({ customLink: courtCustomLink, enabled: !!courtCustomLink });
  const { mutateAsync: createTournament, isLoading: isCreateLoading } = useCreateTournamentMutation();
  const { mutateAsync: updateTournament, isLoading: isUpdateLoading } = useUpdateTournamentMutation();

  const [display, setDisplay] = useState<boolean>(false);

  // 轉換 tournament 資料為表單格式
  const tournamentToFormData = (tournament: TournamentProps): TournamentFormData => ({
    title: tournament.title,
    featuredImg: tournament.featuredImg,
    excerpt: tournament.excerpt,
    content: tournament.content,
    customLink: tournament.customLink,
    court: tournament.court,
    courtTitle: tournament.courtTitle,
    courtCustomLink: tournament.courtCustomLink,
    gamerCount: tournament.tournament.gamerCount,
    tournament: {
      tournamentDate: tournament.tournament.tournamentDate,
      tournamentDeadlineDate: tournament.tournament.tournamentDeadlineDate,
      tournamentType: tournament.tournament.tournamentType,
      tournamentFee: tournament.tournament.tournamentFee,
      prizeFirst: tournament.tournament.prizeFirst,
      prizeSecond: tournament.tournament.prizeSecond,
      prizeThird: tournament.tournament.prizeThird,
      contactName: tournament.tournament.contactName || '',
      contactPhone: tournament.tournament.contactPhone || '',
      defaultGames: tournament.tournament.defaultGames,
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { isDirty, errors },
  } = useForm<TournamentFormData>({
    resolver: yupResolver(tournamentValidationSchema),
    defaultValues:
      mode === TournamentFormMode.Create
        ? defaultTournament
        : tournament
          ? tournamentToFormData(tournament)
          : defaultTournament,
  });

  const messageArray = useMemo((): string[] => {
    return Object.values(errors).flatMap((error) => (Array.isArray(error) ? error.map((e) => e.message) : [error.message]));
  }, [errors]);

  const onSubmit = useCallback(
    async (data: TournamentFormData) => {
      const action = mode === TournamentFormMode.Create ? '新增' : '更新';
      const confirmed = window.confirm(`您確定要${action}${data.title}嗎?`);
      if (!confirmed || !user) return;

      // 轉換表單資料為 API 格式
      const formattedData: CreateTournamentProps = {
        title: data.title,
        featuredImg: data.featuredImg,
        excerpt: data.excerpt,
        content: data.content,
        customLink: data.customLink,
        court: data.court,
        courtTitle: data.courtTitle,
        courtCustomLink: data.courtCustomLink,
        tournament: {
          gamerCount: data.gamerCount,
          gamers: [],
          matches: [],
          tournamentType: data.tournament.tournamentType,
          tournamentDate: data.tournament.tournamentDate,
          tournamentDeadlineDate: data.tournament.tournamentDeadlineDate,
          tournamentFee: data.tournament.tournamentFee,
          prizeFirst: data.tournament.prizeFirst,
          prizeSecond: data.tournament.prizeSecond,
          prizeThird: data.tournament.prizeThird,
          defaultGames: data.tournament.defaultGames,
        },
      };

      if (court) {
        formattedData.court = court._id;
        formattedData.courtTitle = court.title;
        formattedData.courtCustomLink = court.customLink;
      }

      try {
        const result =
          mode === TournamentFormMode.Edit && tournament
            ? await updateTournament({
                ...tournament,
                ...formattedData,
                tournament: {
                  ...tournament.tournament,
                  ...data.tournament,
                },
              })
            : await createTournament(formattedData);

        if (typeof result === 'string') throw new Error(result);

        const { message } = result;
        if (message) showToast({ message });

        reset(data);
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
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-6 gap-4 w-[600px] max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col col-span-4 justify-center">
            {messageArray.length > 0 &&
              messageArray.map((message, index) => (
                <label key={index} className="text-red-500 text-[12px]">
                  {message}
                </label>
              ))}
          </div>

          <div className="flex justify-end col-span-2 items-center">
            <Button
              type="submit"
              text={mode === TournamentFormMode.Create ? '新增' : '更新'}
              disabled={!isDirty || isCreateLoading || isUpdateLoading}
            />
          </div>

          <div className="flex flex-col col-span-6">
            <label>預覽圖</label>
            <ImageUpload
              control={control}
              defaultImage={
                tournament?.featuredImg
                  ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_FEATURED_IMAGE_FOLDER}/${tournament?.featuredImg}`
                  : process.env.NEXT_PUBLIC_FEATURED_IMAGE
              }
            />
          </div>

          <FormField control={control} titleText="球場賽程" fieldName="title" placeholder="球場賽程名稱" col={6} />

          {/* 比賽日期 */}
          <div className="flex flex-col col-span-3">
            <label>比賽日期</label>
            <Controller
              name="tournament.tournamentDate"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    type={InputStyleType.DatetimeLocal}
                    value={field.value ? moment(field.value).format('YYYY-MM-DDTHH:mm') : ''}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                  <FieldErrorlabel error={error} />
                </>
              )}
            />
          </div>

          {/* 報名截止日期 */}
          <div className="flex flex-col col-span-3">
            <label>報名截止日期</label>
            <Controller
              name="tournament.tournamentDeadlineDate"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    type={InputStyleType.DatetimeLocal}
                    value={field.value ? moment(field.value).format('YYYY-MM-DDTHH:mm') : ''}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                  <FieldErrorlabel error={error} />
                </>
              )}
            />
          </div>

          {/* 比賽類型 */}
          <div className="flex flex-col col-span-3">
            <label>比賽類型</label>
            <Controller
              name="tournament.tournamentType"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Select
                    disabled
                    value={field.value}
                    onChange={field.onChange}
                    defaultValue="選擇比賽類型"
                    options={[
                      { value: TournamentType.SINGLE, label: composeTournamentType(TournamentType.SINGLE) },
                      { value: TournamentType.DOUBLE, label: composeTournamentType(TournamentType.DOUBLE) },
                    ]}
                  />
                  <FieldErrorlabel error={error} />
                </>
              )}
            />
          </div>

          {/* 參賽人數 */}
          <div className="flex flex-col col-span-3">
            <label>參賽人數</label>
            <Controller
              name="gamerCount"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Select
                    disabled
                    value={field.value}
                    onChange={field.onChange}
                    defaultValue="選擇參賽人數"
                    options={Object.values(GamerCountType).filter((item) => typeof item === 'number')}
                  />
                  <FieldErrorlabel error={error} />
                </>
              )}
            />
          </div>

          {/* 預設局數 */}
          <div className="flex flex-col col-span-3">
            <label>預設局數(顆數)</label>
            <Controller
              name="tournament.defaultGames"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input value={field.value} onChange={field.onChange} type={InputStyleType.Number} min={0} max={21} />
                  <FieldErrorlabel error={error} />
                </>
              )}
            />
          </div>

          {/* 報名費 */}
          <div className="flex flex-col col-span-3">
            <label>報名費 (元)</label>
            <Controller
              name="tournament.tournamentFee"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    type={InputStyleType.Number}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    min={0}
                    max={10000}
                    placeholder="輸入報名費"
                  />
                  <FieldErrorlabel error={error} />
                </>
              )}
            />
          </div>

          {/* 聯絡人姓名 */}
          <div className="flex flex-col col-span-3">
            <label>聯絡人姓名</label>
            <Controller
              name="tournament.contactName"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    type={InputStyleType.Text}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="輸入聯絡人姓名"
                  />
                  <FieldErrorlabel error={error} />
                </>
              )}
            />
          </div>

          {/* 聯絡人電話 */}
          <div className="flex flex-col col-span-3">
            <label>聯絡人電話</label>
            <Controller
              name="tournament.contactPhone"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    type={InputStyleType.Tel}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="輸入聯絡人電話 (例: 0912345678)"
                  />
                  <FieldErrorlabel error={error} />
                </>
              )}
            />
          </div>

          {/* 冠軍獎金 */}
          <div className="flex flex-col col-span-2">
            <label>冠軍獎金 (元)</label>
            <Controller
              name="tournament.prizeFirst"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    type={InputStyleType.Number}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    min={0}
                    max={100000}
                    placeholder="冠軍獎金"
                  />
                  <FieldErrorlabel error={error} />
                </>
              )}
            />
          </div>

          {/* 亞軍獎金 */}
          <div className="flex flex-col col-span-2">
            <label>亞軍獎金 (元)</label>
            <Controller
              name="tournament.prizeSecond"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    type={InputStyleType.Number}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    min={0}
                    max={100000}
                    placeholder="亞軍獎金"
                  />
                  <FieldErrorlabel error={error} />
                </>
              )}
            />
          </div>

          {/* 季軍獎金 */}
          <div className="flex flex-col col-span-2">
            <label>季軍獎金 (元)</label>
            <Controller
              name="tournament.prizeThird"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    type={InputStyleType.Number}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    min={0}
                    max={100000}
                    placeholder="季軍獎金"
                  />
                  <FieldErrorlabel error={error} />
                </>
              )}
            />
          </div>

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
      tournament?.featuredImg,
      tournament?.customLink,
      composeTournamentType,
    ]
  );

  const onClick = useCallback(() => setDisplay(true), []);

  useEffect(() => {
    if (!isLoading && !court && !isError) notFound();
  }, [isLoading, court, isError, setValue]);

  if (isLoading) return <></>;
  if (isError) return <></>;
  if (!court) return <></>;

  return (
    <>
      {title && (
        <span className="cursor-pointer hover:text-link transition" onClick={onClick}>
          {title}
        </span>
      )}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-6 h-6 cursor-pointer hover:text-link transition"
        onClick={onClick}
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

      {form}
    </>
  );
};
