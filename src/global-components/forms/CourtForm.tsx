'use client';

import { CourtProps } from '@/domains/court';

export enum CourtFormMode {
  Create = 'create',
  Edit = 'edit',
}

interface CourtFormProps {
  mode: CourtFormMode;
  court?: CourtProps;
  onSuccess?: () => void;
}

// const defaultCourt: UpdateCourtProps = {
//   partner: false,
//   orgCode: '',
//   owner: '',
//   gender: GenderType.None,
//   websiteUrl: '',
//   email: '',
//   phone: '',
//   county: '' as CountyType,
//   district: '',
//   address: '',
//   title: '',
//   excerpt: '',
//   content: '',
//   keywords: [],
//   featuredImg: '',
//   openTime: '',
//   closeTime: '',
//   status: false,
//   customLink: '',
//   googleTitle: '',
//   smoke: false,
//   coachs: [],
//   companyName: '',
// };

export const CourtForm = ({ mode }: CourtFormProps) => {
  if (!mode) return <></>;
  // const { user, login } = useAuth();
  // const { showToast } = useToast();

  // const { mutateAsync: createCourt, isLoading: isCreateLoading } = useCreateCourtMutation();
  // const { mutateAsync: updateCourt, isLoading: isUpdateLoading } = useUpdateCourtMutation({
  //   onSuccess,
  // });
  // const { mutateAsync: getMe } = useGetMeMutation();

  // const [display, setDisplay] = useState<boolean>(false);
  // const [expand, setExpand] = useState<boolean>(false);

  // const {
  //   control,
  //   handleSubmit,
  //   reset,
  //   watch,
  //   setValue,
  //   formState: { isDirty, errors },
  // } = useForm<UpdateCourtProps>({
  //   resolver: yupResolver(courtValidationSchema),
  //   defaultValues: mode === CourtFormMode.Create ? defaultCourt : court,
  // });

  // const messageArray = useMemo((): string[] => {
  //   return Object.values(errors).flatMap((error) => (Array.isArray(error) ? error.map((e) => e.message) : [error.message]));
  // }, [errors]);

  // const county = watch('county');

  // const onSubmit = useCallback(
  //   async (data: UpdateCourtProps) => {
  //     const action = mode === CourtFormMode.Create ? '新增' : '更新';
  //     const confirmed = window.confirm(`您確定要${action}${data.title}嗎?`);
  //     if (!confirmed || !user) return;

  //     try {
  //       const processedData = {
  //         ...data,
  //         address: data.address.replaceAll(data.county, '').replaceAll(data.district, ''),
  //       };

  //       const result =
  //         mode === CourtFormMode.Create
  //           ? await createCourt(processedData)
  //           : court?._id &&
  //             (await updateCourt({
  //               _id: court._id,
  //               ...processedData,
  //             }));

  //       if (typeof result === 'string' || !result) throw new Error(result);

  //       const { message } = result;
  //       if (message) showToast({ message });

  //       reset(data);
  //       setDisplay(false);

  //       // 如果是新增模式且有 user，更新用戶資訊
  //       if (mode === CourtFormMode.Create && user) {
  //         const { token } = await getMe({ _id: user._id });
  //         if (token) login({ token });
  //       }

  //       // 如果是編輯模式且有 onSuccess callback，執行它
  //       else if (mode === CourtFormMode.Edit && onSuccess) {
  //         onSuccess();
  //       }
  //     } catch (error) {
  //       console.error(`${mode} error:`, error);
  //     }
  //   },
  //   [mode, createCourt, updateCourt, court, user, getMe, login, reset, showToast, onSuccess]
  // );

  // const form = useMemo(
  //   (): ReactNode => (
  //     <Popup
  //       title={mode === CourtFormMode.Create ? '新增撞球場地' : '編輯撞球場地'}
  //       display={display}
  //       onClose={() => setDisplay(false)}
  //     >
  //       <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-6 gap-4 w-[500px]">
  //         <div className="flex flex-col col-span-3 justify-center">
  //           {messageArray.length > 0 &&
  //             messageArray.map((message, index) => (
  //               <label key={index} className="text-red-500 text-[12px]">
  //                 {message}
  //               </label>
  //             ))}
  //         </div>

  //         <div className="flex justify-end col-span-3 items-center">
  //           <Button
  //             type="submit"
  //             text={mode === CourtFormMode.Create ? '新增' : '更新'}
  //             disabled={!isDirty || isCreateLoading || isUpdateLoading}
  //           />
  //         </div>

  //         <div className="flex flex-col col-span-6">
  //           <label>預覽圖</label>
  //           <ImageUpload
  //             control={control}
  //             defaultImage={
  //               court?.featuredImg
  //                 ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_FEATURED_IMAGE_FOLDER}/${court?.featuredImg}`
  //                 : process.env.NEXT_PUBLIC_FEATURED_IMAGE
  //             }
  //           />
  //         </div>

  //         <FormField control={control} titleText="撞球場地" fieldName="title" placeholder="撞球場地名稱" col={6} />
  //         <FormField control={control} titleText="Google名稱" fieldName="googleTitle" placeholder="Google登記名稱" col={6} />

  //         <Controller
  //           name="partner"
  //           control={control}
  //           render={({ field: { onChange, value } }) => (
  //             <div className="flex items-center col-span-3">
  //               <Input type={InputStyleType.Checkbox} checked={value} onChange={(e) => onChange(e.target.checked)} />
  //               <label className="text-sm">{`${process.env.NEXT_PUBLIC_SITENAME}合作夥伴`}</label>
  //             </div>
  //           )}
  //         />

  //         <Controller
  //           name="status"
  //           control={control}
  //           render={({ field: { onChange, value } }) => (
  //             <div className="flex items-center col-span-3">
  //               <Input type={InputStyleType.Checkbox} checked={value} onChange={(e) => onChange(e.target.checked)} />
  //               <label className="text-sm">開業狀態</label>
  //             </div>
  //           )}
  //         />

  //         <FormField control={control} titleText="機構代碼" fieldName="orgCode" placeholder="機構代碼" col={3} />

  //         <div className="flex flex-col col-span-3">
  //           <label>縣市</label>
  //           <Controller
  //             name="county"
  //             control={control}
  //             render={({ field, fieldState: { error } }) => (
  //               <>
  //                 <Select {...field} defaultValue="所有縣市" options={Object.values(CountyType)} />
  //                 <FieldErrorlabel error={error} />
  //               </>
  //             )}
  //           />
  //         </div>

  //         <div className="flex flex-col col-span-3">
  //           <label>地區</label>
  //           <Controller
  //             name="district"
  //             control={control}
  //             render={({ field, fieldState: { error } }) => (
  //               <>
  //                 <Select {...field} defaultValue="所有地區" options={Object.values(districtOptions[county] ?? {})} />
  //                 <FieldErrorlabel error={error} />
  //               </>
  //             )}
  //           />
  //         </div>

  //         <FormField
  //           control={control}
  //           titleText="地址"
  //           fieldName="address"
  //           placeholder="完整地址(無需包含縣市及地址)"
  //           col={3}
  //         />

  //         <FormField
  //           control={control}
  //           type={InputStyleType.Tel}
  //           titleText="電話"
  //           fieldName="phone"
  //           placeholder="聯絡電話"
  //           col={3}
  //         />

  //         <FormField
  //           control={control}
  //           type={InputStyleType.Email}
  //           titleText="信箱"
  //           fieldName="email"
  //           placeholder="聯絡信箱"
  //           col={3}
  //           autoComplete={AutoCompleteType.Email}
  //         />

  //         <FormField
  //           control={control}
  //           titleText="負責人"
  //           fieldName="owner"
  //           placeholder="負責人姓名"
  //           col={3}
  //           autoComplete={AutoCompleteType.GivenName}
  //         />

  //         <div className="flex flex-col col-span-3">
  //           <label>負責人性別</label>
  //           <Controller
  //             name="gender"
  //             control={control}
  //             render={({ field, fieldState: { error } }) => (
  //               <div>
  //                 <div className="flex justify-around gap-x-2">
  //                   <Button
  //                     element={<>男</>}
  //                     onClick={() => field.onChange(GenderType.Male)}
  //                     className={`${defaultButtonStyle} w-full p-2 border rounded-md ${
  //                       field.value === GenderType.Male ? 'bg-link text-background' : 'bg-backgroundLight'
  //                     }`}
  //                   />
  //                   <Button
  //                     element={<>女</>}
  //                     onClick={() => field.onChange(GenderType.Female)}
  //                     className={`${defaultButtonStyle} w-full p-2 border rounded-md ${
  //                       field.value === GenderType.Female ? 'bg-link text-background' : 'bg-backgroundLight'
  //                     }`}
  //                   />
  //                 </div>
  //                 <FieldErrorlabel error={error} />
  //               </div>
  //             )}
  //           />
  //         </div>

  //         <FormField
  //           control={control}
  //           type={InputStyleType.Time}
  //           titleText="營業時間"
  //           fieldName="openTime"
  //           placeholder="營業時間"
  //           col={3}
  //         />
  //         <FormField
  //           control={control}
  //           type={InputStyleType.Time}
  //           titleText="休息時間"
  //           fieldName="closeTime"
  //           placeholder="休息時間"
  //           col={3}
  //         />

  //         <FormField control={control} titleText="自訂網址名稱" fieldName="customLink" placeholder="網址名稱" col={3} />

  //         <div className="flex flex-col col-span-3">
  //           <label>關鍵字</label>
  //           <Controller
  //             name="keywords"
  //             control={control}
  //             render={({ field, fieldState: { error } }) => (
  //               <>
  //                 <Input
  //                   {...field}
  //                   value={Array.isArray(field.value) ? field.value.join(',') : ''}
  //                   onChange={(event: ChangeEvent<HTMLInputElement>) =>
  //                     field.onChange(event.target.value ? event.target.value.split(',') : [])
  //                   }
  //                   placeholder="關鍵字 (多個用半形逗號分隔)"
  //                 />
  //                 <TagGroup
  //                   tags={field.value}
  //                   fieldName="keywords"
  //                   setValue={setValue as unknown as UseFormSetValue<FieldValues>}
  //                 />
  //                 <FieldErrorlabel error={error} />
  //               </>
  //             )}
  //           />
  //         </div>

  //         <FormField
  //           control={control}
  //           type={InputStyleType.Url}
  //           titleText="網站網址"
  //           fieldName="websiteUrl"
  //           placeholder={process.env.NEXT_PUBLIC_BASE_URL}
  //           col={3}
  //         />

  //         <FormField
  //           control={control}
  //           type={InputStyleType.Url}
  //           titleText="預覽圖網址"
  //           fieldName="featuredImg"
  //           placeholder="上傳圖片後會自生成網址"
  //           col={3}
  //           disabled
  //         />

  //         <FormField control={control} titleText="簡述" fieldName="excerpt" placeholder="醫療機構的簡述" col={6} />

  //         <div className="flex flex-col col-span-6">
  //           <label>內容</label>
  //           <Controller
  //             name="content"
  //             control={control}
  //             render={({ field, fieldState: { error } }) => (
  //               <>
  //                 <TextArea {...field} placeholder="醫療機構的詳細內容" />
  //                 <FieldErrorlabel error={error} />
  //               </>
  //             )}
  //           />
  //         </div>

  //         <div className="col-span-6">
  //           <Button type="button" text="詳細內容" onClick={() => setExpand(!expand)} />
  //         </div>
  //       </form>
  //     </Popup>
  //   ),
  //   [
  //     mode,
  //     display,
  //     handleSubmit,
  //     onSubmit,
  //     messageArray,
  //     isDirty,
  //     isCreateLoading,
  //     isUpdateLoading,
  //     control,
  //     court?.featuredImg,
  //     expand,
  //     county,
  //     setValue,
  //   ]
  // );

  // const onClick = () => setDisplay(true);

  return (
    <>
      {/* <svg
        onClick={onClick}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-6 h-6 cursor-pointer hover:text-link transition"
      >
        {mode === CourtFormMode.Create ? (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </>
        ) : (
          <path d="M3 17.25V21h3.75l11.39-11.39-3.75-3.75L3 17.25zM16 3l5 5-2 2-5-5 2-2z" />
        )}
      </svg>
      {form} */}
    </>
  );
};
