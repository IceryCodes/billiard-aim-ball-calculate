import { AddPaymentProps, VerifyPaymentProps } from '@/domains/payment';
import { apiOrigin, logApiError } from '@/utils/api';

import { AddPaymentReturnType, GetPaymentsReturnType } from './interfaces';

export const paymentQueryKeys = {
  getPayment: 'getPayment',
  getPayments: 'getPayments',
} as const;

export const addPayment = async (payment: AddPaymentProps): Promise<AddPaymentReturnType> => {
  try {
    const { data } = await apiOrigin.post('/add-payment', payment);

    return data;
  } catch (error) {
    const message = '提交付款失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const verifyPayment = async (payment: VerifyPaymentProps): Promise<AddPaymentReturnType> => {
  try {
    const { data } = await apiOrigin.post('/verify-payment', payment);

    return data;
  } catch (error) {
    const message = '確認付款狀態失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const getPayments = async (): Promise<GetPaymentsReturnType> => {
  try {
    const { data } = await apiOrigin.get('/get-payments');

    return {
      payments: data.payments.length ? data.payments : [],
      total: data.total ? data.total : 0,
      message: 'Success',
    };
  } catch (error) {
    const message = '搜尋付款記錄失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};
