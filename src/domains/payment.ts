export enum PaymentStatusType {
  Wait = -1,
  Success = 0,
  Fail = 1,
}

export enum PaymentCardType {
  DomesticCard = 0, // 國內卡
  ForeignCard = 1, // 國外卡
}

export interface PaymentBaseProps {
  _id: string;
  name: string;
  message: string;
  isPublic: boolean;
  amount: number;
  status: PaymentStatusType;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentProps extends PaymentBaseProps {
  orderSn: string;
  chargeNo?: string;
  fee?: number;
  foreignCard?: PaymentCardType;
  remark?: string;
  time?: Date;
  check?: string;
  cardNumber: string;
  securityCode: string;
  expiryYear: string;
  expiryMonth: string;
  returnUrl: string;
}

export interface AddPaymentProps {
  userId: string;
  name: string;
  isPublic: boolean;
  amount: number;
  message: string;
  cardNumber: string;
  securityCode: string;
  expiryYear: string;
  expiryMonth: string;
  returnUrl: string;
}

export type AddPaymentPropsDto = AddPaymentProps;

export interface VerifyPaymentProps {
  orderId: string;
  userId: string;
  email: string;
}

export interface InstoPayUpdateReturn {
  type: number;
  status: number;
  order_sn: string;
  charge_no: string;
  amount: number;
  fee: number;
  foreign_card: number;
  remark: string;
  time: number;
  check: string;
}
