import { UserLoginDto, UserRegisterDto, UserResendVerificationDto, UserUpdateDto } from '@/domains/user';
import { UserLoginReturnType, UserResendVerificationReturnType, UserUpdateReturnType } from '@/services/interfaces';
import { apiOrigin, logApiError } from '@/utils/api';

export const userRegister = async ({
  firstName,
  lastName,
  gender,
  email,
  password,
}: UserRegisterDto): Promise<UserLoginReturnType> => {
  try {
    const { data } = await apiOrigin.post('/user-register', {
      firstName,
      lastName,
      gender,
      email,
      password,
    });
    return data;
  } catch (error) {
    const message = '此電子郵件已被註冊!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const userLogin = async ({ email, password }: UserLoginDto): Promise<UserLoginReturnType> => {
  try {
    const { data } = await apiOrigin.post('/user-login', { email, password });
    return data;
  } catch (error) {
    const message = '帳號或密碼錯誤!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const userResendVerification = async ({
  _id,
}: UserResendVerificationDto): Promise<UserResendVerificationReturnType> => {
  try {
    const { data } = await apiOrigin.post('/resend-verification', { _id });
    return data;
  } catch (error) {
    const message = '登入失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const userUpdate = async ({ _id, firstName, lastName, gender }: UserUpdateDto): Promise<UserUpdateReturnType> => {
  try {
    const { data } = await apiOrigin.patch('/update-user', {
      _id,
      firstName,
      lastName,
      gender,
    });
    return data;
  } catch (error) {
    const message = '更新失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};
