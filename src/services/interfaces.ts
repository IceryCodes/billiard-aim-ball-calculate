import { ArticleProps } from '@/domains/article';
import { CourtProps } from '@/domains/court';
import {
  GoogleAddressComponent,
  GoogleBusinessStatus,
  GoogleGeometry,
  GoogleOpeningHours,
  GooglePhoto,
  GooglePlusCode,
  GoogleReview,
} from '@/domains/google';
import { UserManageProps } from '@/domains/manage';
import { PaymentBaseProps, PaymentStatusType } from '@/domains/payment';
import { PlayerProps } from '@/domains/player';
import { TournamentProps } from '@/domains/tournament';
import { UserProps } from '@/domains/user';

export interface GetCourtReturnType {
  court?: CourtProps | null;
  manage?: boolean;
  message: string;
}

export interface GetCourtsReturnType {
  courts?: CourtProps[];
  total?: number;
  message: string;
}

export interface CourtUpdateReturnType {
  message: string;
}

export interface TournamentUpdateReturnType {
  message: string;
}

export interface GetPlayerReturnType {
  player?: PlayerProps | null;
  manage?: boolean;
  message: string;
}

export interface GetPlayersReturnType {
  players?: PlayerProps[];
  total?: number;
  message: string;
}

export interface PlayerUpdateReturnType {
  message: string;
}

export interface ManageUpdateReturnType {
  message: string;
}

export interface GetUserReturnType {
  user?: UserProps;
  manage?: UserManageProps;
  message: string;
}

export interface GetUsersReturnType {
  users?: UserProps[];
  total?: number;
  message: string;
}

export interface UserRegisterReturnType {
  token?: string;
  message: string;
}

export interface UserLoginReturnType {
  token?: string;
  message: string;
}

export interface UserVerifyReturnType {
  message: string;
}

export interface UserResendVerificationReturnType {
  message: string;
}

export interface UserUpdateReturnType {
  message: string;
}

export interface GetGoogleInfosReturnType {
  address_components: GoogleAddressComponent[];
  adr_address: string;
  business_status: GoogleBusinessStatus;
  formatted_address: string;
  formatted_phone_number?: string;
  geometry: GoogleGeometry | null;
  icon: string;
  icon_background_color: string;
  icon_mask_base_uri: string;
  international_phone_number?: string;
  name: string;
  opening_hours?: GoogleOpeningHours | null;
  photos: GooglePhoto[];
  place_id: string;
  plus_code?: GooglePlusCode | null;
  types: string[];
  url: string;
  utc_offset: number;
  vicinity: string;
  website: string;
  price_level: number | null;
  rating: number;
  reviews: GoogleReview[];
  user_ratings_total: number;
  scope: string;
  permanently_closed: boolean;
  reservable: boolean;
  serves_beer: boolean;
  serves_breakfast: boolean;
  serves_brunch: boolean;
  serves_dinner: boolean;
  serves_lunch: boolean;
  serves_vegetarian_food: boolean;
  takeout: boolean;
}

export interface SendFeedbackReturnType {
  message: string;
}

export interface AddPaymentReturnType {
  message: string;
  orderId?: string;
  paymentUrl?: string;
}

export interface VerifyPaymentReturnType {
  message: string;
  payment?: PaymentBaseProps;
}

export interface AddInstoPaymentReturnType {
  msg: string; //錯誤訊息
  data?: {
    order_sn: string;
    amount: number;
    status: PaymentStatusType;
    _id: string;
    __v: number;
  };
}

export interface GetPaymentsReturnType {
  payments?: PaymentBaseProps[];
  total?: number;
  message: string;
}

export interface ImageUploadReturnType {
  success: boolean;
  filename?: string;
  imageUrl?: string;
  error?: string;
}

export interface GetTournamentReturnType {
  tournament?: TournamentProps | null;
  message: string;
}

export interface GetTournamentsReturnType {
  tournaments?: TournamentProps[];
  total?: number;
  message: string;
}

export interface GetArticleReturnType {
  article?: ArticleProps | null;
  message: string;
}

export interface GetArticlesReturnType {
  articles?: ArticleProps[];
  total?: number;
  message: string;
}

export interface GenerateArticleReturnType {
  message: string;
}
