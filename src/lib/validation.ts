import * as yup from 'yup';
import {
  AnyObject,
  array,
  ArraySchema,
  boolean,
  BooleanSchema,
  date,
  DateSchema,
  mixed,
  MixedSchema,
  number,
  NumberSchema,
  object,
  string,
  StringSchema,
} from 'yup';

import {
  CountyType,
  districtOptions,
  DistrictOptionsProps,
  DistrictType,
  GenderType,
  UserRoleType,
} from '@/domains/interface';
import { GameTypesType, TournamentType } from '@/domains/tournament';

interface RulesProps {
  //user
  firstName: StringSchema<string, AnyObject, undefined, ''>;
  lastName: StringSchema<string, AnyObject, undefined, ''>;
  email: StringSchema<string, AnyObject, undefined, ''>;
  password: StringSchema<string, AnyObject, undefined, ''>;
  gender: MixedSchema<NonNullable<GenderType>, AnyObject, undefined, ''>;
  role: MixedSchema<NonNullable<UserRoleType>, AnyObject, undefined, ''>;
  manages: ArraySchema<string[] | undefined, AnyObject, '', ''>;

  // court
  partner: BooleanSchema<boolean, AnyObject>;
  orgCode: StringSchema<string, AnyObject>;
  owner: StringSchema<string | undefined, AnyObject>;
  genderOptional: MixedSchema<GenderType | undefined, AnyObject, undefined, ''>;
  gameTypes: ArraySchema<GameTypesType[], AnyObject, '', ''>;
  websiteUrl: StringSchema<string | undefined, AnyObject, undefined, ''>;
  phone: StringSchema<string | undefined, AnyObject>;
  phoneOptional: StringSchema<string | undefined, AnyObject>;
  emailOptional: StringSchema<string | undefined, AnyObject>;
  county: StringSchema<CountyType, AnyObject>;
  district: MixedSchema<DistrictType, AnyObject>;
  address: StringSchema<string, AnyObject>;
  title: StringSchema<string, AnyObject>;
  excerpt: StringSchema<string | undefined, AnyObject>;
  content: StringSchema<string | undefined, AnyObject>;
  keywords: ArraySchema<string[] | undefined, AnyObject, '', ''>;
  featuredImg: StringSchema<string | undefined, AnyObject>;
  openTime: StringSchema<string | undefined, AnyObject>;
  closeTime: StringSchema<string | undefined, AnyObject>;
  status: BooleanSchema<boolean, AnyObject>;
  customLink: StringSchema<string | undefined, AnyObject>;
  googleTitle: StringSchema<string, AnyObject>;
  smoke: BooleanSchema<boolean, AnyObject>;
  coachs: ArraySchema<string[] | undefined, AnyObject, '', ''>;
  companyName: StringSchema<string, AnyObject>;

  // tournament
  tournamentTitle: StringSchema<string, AnyObject>;
  court: StringSchema<string | undefined, AnyObject>;
  courtTitle: StringSchema<string | undefined, AnyObject>;
  courtCustomLink: StringSchema<string | undefined, AnyObject>;
  gamerCount: NumberSchema<number, AnyObject>;
  tournamentDate: DateSchema<Date, AnyObject>;
  tournamentDeadlineDate: DateSchema<Date, AnyObject>;
  tournamentType: MixedSchema<TournamentType, AnyObject>;
  tournamentFee: NumberSchema<number, AnyObject>;
  prizeFirst: NumberSchema<number, AnyObject>;
  prizeSecond: NumberSchema<number, AnyObject>;
  prizeThird: NumberSchema<number, AnyObject>;
  contactName: StringSchema<string | undefined, AnyObject>;
  contactPhone: StringSchema<string | undefined, AnyObject>;
  defaultGames: NumberSchema<number, AnyObject>;

  // player
  professional: BooleanSchema<boolean, AnyObject>;
  licenses: ArraySchema<Array<{ type: string; date: Date }> | undefined, AnyObject, '', ''>;

  // feedback
  message: StringSchema<string, AnyObject>;

  // donate
  public: BooleanSchema<boolean, AnyObject>;
  amount: NumberSchema<number, AnyObject>;
  messageOptional: StringSchema<string | undefined, AnyObject>;
  cardNumber: StringSchema<string, AnyObject>;
  securityCode: StringSchema<string, AnyObject>;
  expiryYear: StringSchema<string, AnyObject>;
  expiryMonth: StringSchema<string, AnyObject>;
}

const rules: RulesProps = {
  // user
  firstName: string()
    .required('名字是必填項目')
    .min(1, '名字至少需要1個字')
    .matches(/^[^\s#!@*()\\"';/%^=_$`,.?:+]+$/, '名字不能包含空格或特殊字符'),
  lastName: string()
    .required('姓氏是必填項目')
    .min(1, '姓氏至少需要1個字')
    .matches(/^[^\s#!@*()\\"';/%^=_$`,.?:+]+$/, '姓氏不能包含空格或特殊字符'),
  email: string()
    .email('無效的信箱格式')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, '請輸入有效的信箱格式')
    .max(254, '信箱長度不可超過254個字元')
    .matches(/^[^<>()[\]\\,;:\s@"]+@/, '信箱開頭不可包含特殊字元')
    .matches(/@[^<>()[\]\\,;:\s@"]+$/, '網域名稱不可包含特殊字元')
    .required('信箱是必填項目'),
  password: yup
    .string()
    .required('密碼是必填項目')
    .min(8, '密碼至少需要8個字')
    .matches(/(?=.*[0-9])(?=.*[A-Z])/, '密碼必須包含至少一個數字和一個大寫字母'),
  gender: mixed<GenderType>().oneOf([GenderType.Male, GenderType.Female], '性別必須為有效選項').required('性別是必填項目'),
  role: mixed<UserRoleType>()
    .oneOf([UserRoleType.None, UserRoleType.Admin, UserRoleType.Manager], '身份必須為有效選項')
    .required('身份是必填項目'),
  manages: array()
    .of(
      string()
        .min(2, '選手ID至少需要2個字')
        .matches(/^[^#!@*()\\";/%^=_$`,.?:+]+$/, '不能包含特殊字符')
        .required('選手ID是必填項目')
    )
    .required('選手ID是必填項目'),

  // court
  partner: boolean().required('必須選擇是否為合作夥伴'),
  orgCode: string()
    .required('機構代碼是必填項目')
    .matches(/^[^\s#!@*()\\"';/%^=_$`,.?:+]+$/, '機構代碼不能包含空格或特殊字符'),
  owner: string().test('is-owner-or-empty', '負責人名稱不能包含特殊字符', (value) => {
    if (!value || value === '') return true;
    return value.length >= 1;
  }),
  genderOptional: mixed<GenderType>().oneOf([GenderType.None, GenderType.Male, GenderType.Female], '性別必須為有效選項'),
  gameTypes: array().of(mixed<GameTypesType>().required()).required('種類是必填項目'),
  websiteUrl: string().test('is-valid-url', '無效的網址格式', (value) => {
    if (!value) return true;

    try {
      const url = new URL(value);

      if (!url.protocol.startsWith('https:')) {
        return false;
      }

      const hostnameRegex = /^[a-zA-Z0-9.-]+$/;
      if (!hostnameRegex.test(url.hostname)) {
        return false;
      }

      if (!url.hostname.includes('.')) {
        return false;
      }

      const parts = url.hostname.split('.');
      const tld = parts[parts.length - 1];
      if (tld.length < 2) {
        return false;
      }

      if (/[<>()[\]\\,;\s@"]/.test(value)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }),
  phone: string()
    .matches(/^(0[2-9]|0[2-9]-|\+886[2-9]-)?\d{6,8}$/, '請輸入有效的台灣電話號碼格式，例如: 023456789 或 0912345678')
    .min(8, '電話號碼過短')
    .max(12, '電話號碼過長'),
  phoneOptional: string().test('is-phone-or-empty', '請輸入有效的台灣電話號碼格式', (value) => {
    if (!value || value === '') return true;
    return /^(0[2-9]|0[2-9]-|\+886[2-9]-)?\d{6,8}$/.test(value) && value.length >= 8 && value.length <= 12;
  }),
  emailOptional: string().test('is-email-or-empty', '無效的信箱格式', (value) => {
    if (!value || value === '') return true;
    return (
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value) &&
      value.length <= 254 &&
      /^[^<>()[\]\\,;:\s@"]+@/.test(value) &&
      /@[^<>()[\]\\,;:\s@"]+$/.test(value)
    );
  }),
  county: string().oneOf(Object.values(CountyType), '縣市必須是有效的選項').required('縣市是必填項目'),
  district: mixed<DistrictType>()
    .test('is-valid-district', '請選擇有效的地區', function (value) {
      const county: keyof DistrictOptionsProps = this.parent.county;
      if (!county) return true;

      const validDistricts = districtOptions[county];
      return typeof value === 'string' && Object.values(validDistricts).includes(value);
    })
    .required('地區是必填項目'),
  address: string()
    .min(2, '地址至少需要2個字')
    .matches(/^[^\s#!@*\\"';/%^=_$`,.?:+]+$/, '地址不能包含空格或特殊字符')
    .required('地址是必填項目'),
  title: string()
    .min(2, '標題至少需要2個字')
    .matches(/^[^#!@*()\\"';/%^=_$`,.?:]+$/, '標題不能包含空格或特殊字符')
    .required('名稱是必填項目'),
  excerpt: string(),
  content: string(),
  keywords: array()
    .of(
      string()
        .min(2, '關鍵字至少需要2個字')
        .matches(/^[^#!@*()\\";/%^=_$`,.?:]+$/, '關鍵字不能包含特殊字符')
        .required('關鍵字是必填項目')
    )
    .required('關鍵字是必填項目'),
  featuredImg: string(),
  openTime: string(),
  closeTime: string(),
  status: boolean().required('開業狀態是必填項目'),
  customLink: string(),
  googleTitle: string().required('Google名稱是必填項目'),
  smoke: boolean().required('必須選擇是否為無菸球場'),
  coachs: array()
    .of(
      string()
        .min(2, '駐場教練名稱至少需要2個字')
        .matches(/^[^#!@*()\\";/%^=_$`,.?:]+$/, '駐場教練名稱不能包含特殊字符')
        .required('駐場教練名稱是必填項目')
    )
    .required('駐場教練名稱是必填項目'),
  companyName: string().required('Google名稱是必填項目'),

  // tournament
  tournamentTitle: string()
    .min(2, '標題至少需要2個字')
    .matches(/^[a-zA-Z0-9\u4e00-\u9fff\s\\/\\[\]\\-]+$/, '標題只能包含中英文、數字、空格、方括號、斜線和連字符')
    .required('名稱是必填項目'),
  court: string(),
  courtTitle: string(),
  courtCustomLink: string(),
  gamerCount: number().required('參賽人數是必填項目'),
  tournamentDate: date().required('比賽日期是必填項目'),
  tournamentDeadlineDate: date()
    .required('報名截止日期是必填項目')
    .test('deadline-before-tournament', '報名截止日期必須早於比賽日期', function (value) {
      const tournamentDate = this.parent.tournamentDate;
      if (tournamentDate && value && value > tournamentDate) {
        return false;
      }
      return true;
    }),
  tournamentType: mixed<TournamentType>()
    .oneOf([TournamentType.SINGLE, TournamentType.DOUBLE], '比賽類型必須為有效選項')
    .required('比賽類型是必填項目'),
  tournamentFee: number().required('報名費是必填項目').min(0, '報名費不能為負數').max(10000, '報名費不能超過10000元'),
  prizeFirst: number().required('冠軍獎金是必填項目').min(0, '冠軍獎金不能為負數').max(100000, '冠軍獎金不能超過100000元'),
  prizeSecond: number()
    .required('亞軍獎金是必填項目')
    .min(0, '亞軍獎金不能為負數')
    .max(100000, '亞軍獎金不能超過100000元')
    .test('second-prize-validation', '亞軍獎金不能超過冠軍獎金', function (value) {
      const prizeFirst = this.parent.prizeFirst;
      if (prizeFirst && value && value > prizeFirst) {
        return false;
      }
      return true;
    }),
  prizeThird: number()
    .required('季軍獎金是必填項目')
    .min(0, '季軍獎金不能為負數')
    .max(100000, '季軍獎金不能超過100000元')
    .test('third-prize-validation', '季軍獎金不能超過亞軍獎金', function (value) {
      const prizeSecond = this.parent.prizeSecond;
      if (prizeSecond && value && value > prizeSecond) {
        return false;
      }
      return true;
    }),
  contactName: string().test('is-contact-name-or-empty', '聯絡人姓名不能包含特殊字符', (value) => {
    if (!value || value === '') return true;
    return value.length >= 1 && /^[^#!@*()\\";/%^=_$`,.?:]+$/.test(value);
  }),
  contactPhone: string().test('is-contact-phone-or-empty', '請輸入有效的台灣電話號碼格式', (value) => {
    if (!value || value === '') return true;
    return /^(0[2-9]|0[2-9]-|\+886[2-9]-)?\d{6,8}$/.test(value) && value.length >= 8 && value.length <= 12;
  }),
  defaultGames: number()
    .required('預設局數(顆數)是必填項目')
    .min(1, '少於1局(顆)打屁喔')
    .max(100, '預設局數(顆數)不能超過100，會死人'),

  // player
  professional: boolean().required('職業選手是必填項目'),
  licenses: array()
    .of(
      object({
        type: string().required('證照名稱是必填項目'),
        date: date().required('證照日期是必填項目'),
      })
    )
    .required('證照是必填項目'),

  // feedback
  message: string().required('回饋是必填項目'),

  // donate
  public: boolean().required('公開是必填項目'),
  amount: number().required('金額是必填項目'),
  messageOptional: string(),
  cardNumber: string().required('信用卡卡號是必填項目'),
  securityCode: string().required('信用卡安全碼是必填項目'),
  expiryYear: string().required('信用卡到期年份是必填項目'),
  expiryMonth: string().required('信用卡到期月份是必填項目'),
};

export const registerValidationSchema = object({
  firstName: rules.firstName.default(''),
  lastName: rules.lastName.default(''),
  email: rules.email.default(''),
  password: rules.password.default(''),
  gender: rules.gender.default(GenderType.None),
}).required();

export const loginValidationSchema = object({
  email: rules.email.default(''),
  password: rules.password.default(''),
}).required();

export const profileValidationSchema = object({
  firstName: rules.firstName.default(''),
  lastName: rules.lastName.default(''),
  gender: rules.gender.default(GenderType.None),
}).required();

export const courtValidationSchema = object({
  partner: rules.partner.default(false),
  orgCode: rules.orgCode.default(''),
  owner: rules.owner.default(''),
  gender: rules.genderOptional.default(GenderType.None),
  websiteUrl: rules.websiteUrl.default(''),
  email: rules.emailOptional.default(''),
  phone: rules.phone.default(''),
  county: rules.county,
  district: rules.district,
  address: rules.address,
  title: rules.title.default(''),
  excerpt: rules.excerpt.default(''),
  content: rules.content.default(''),
  keywords: rules.keywords.default([]),
  featuredImg: rules.featuredImg.default(''),
  openTime: rules.openTime.default(''),
  closeTime: rules.closeTime.default(''),
  status: rules.status.default(false),
  customLink: rules.customLink.default(''),
  googleTitle: rules.title.default(''),
  smoke: rules.smoke.default(false),
  coachs: rules.coachs.default([]),
  companyName: rules.companyName.default(''),
}).required();

export const tournamentValidationSchema = object({
  title: rules.tournamentTitle.default(''),
  featuredImg: rules.featuredImg.default(''),
  excerpt: rules.excerpt.default(''),
  content: rules.content.default(''),
  customLink: rules.customLink.default(''),
  court: rules.court.default(''),
  courtTitle: rules.courtTitle.default(''),
  courtCustomLink: rules.courtCustomLink.default(''),
  gamerCount: rules.gamerCount.default(32),
  tournament: object({
    tournamentDate: rules.tournamentDate.default(new Date()),
    tournamentDeadlineDate: rules.tournamentDeadlineDate.default(new Date()),
    tournamentType: rules.tournamentType.default(TournamentType.SINGLE),
    tournamentFee: rules.tournamentFee.default(0),
    prizeFirst: rules.prizeFirst.default(0),
    prizeSecond: rules.prizeSecond.default(0),
    prizeThird: rules.prizeThird.default(0),
    contactName: rules.contactName.default(''),
    contactPhone: rules.contactPhone.default(''),
    defaultGames: rules.defaultGames.default(1),
  }).required(),
}).required();

export const playerValidationSchema = object({
  partner: rules.partner.default(false),
  owner: rules.owner.default(''),
  gender: rules.genderOptional.default(GenderType.None),
  websiteUrl: rules.websiteUrl.default(''),
  email: rules.emailOptional.default(''),
  phone: rules.phoneOptional.default(''),
  county: rules.county,
  district: rules.district,
  title: rules.title.default(''),
  excerpt: rules.excerpt.default(''),
  content: rules.content.default(''),
  keywords: rules.keywords.default([]),
  featuredImg: rules.featuredImg.default(''),
  customLink: rules.customLink.default(''),
  gameTypes: rules.gameTypes.default([]),
  professional: rules.professional.default(false),
  licenses: rules.licenses.default([]),
}).required();

export const adminValidationSchema = object({
  role: rules.role.default(UserRoleType.None),
  manages: rules.manages.default([]),
}).required();

export const feedbackValidationSchema = object({
  message: rules.message.default(''),
}).required();

export const donateValidationSchema = object({
  isPublic: rules.public.default(true),
  amount: rules.amount.default(0),
  message: rules.messageOptional.default(''),
  cardNumber: rules.cardNumber.default(''),
  securityCode: rules.securityCode.default(''),
  expiryYear: rules.expiryYear.default(''),
  expiryMonth: rules.expiryMonth.default(''),
}).required();
