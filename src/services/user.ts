import { DeleteUserDto, GetUserDto, GetUsersDto, UserVerifyDto } from '@/domains/user';
import {
  GetUserReturnType,
  GetUsersReturnType,
  UserLoginReturnType,
  UserUpdateReturnType,
  UserVerifyReturnType,
} from '@/services/interfaces';
import { apiOrigin, logApiError } from '@/utils/api';

export const userQueryKeys = {
  getUser: 'getUser',
  getUsers: 'getUsers',
  verifyUser: 'verifyUser',
} as const;

export const getUser = async ({ _id }: GetUserDto): Promise<GetUserReturnType> => {
  try {
    const { data } = await apiOrigin.get('/get-user', {
      params: { _id },
    });
    return data;
  } catch (error) {
    const message = '搜尋帳號失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const getUsers = async ({ email }: GetUsersDto): Promise<GetUsersReturnType> => {
  try {
    const { data } = await apiOrigin.get('/get-users', {
      params: { email },
    });

    return {
      users: data.users.length ? data.users : [],
      total: data.total ? data.total : 0,
      message: 'Success',
    };
  } catch (error) {
    const message = '搜尋帳號失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const verifyUser = async ({ token }: UserVerifyDto): Promise<UserVerifyReturnType> => {
  try {
    const { data } = await apiOrigin.get('/user-verify', {
      params: { token },
    });
    return data;
  } catch (error) {
    const message = '帳號驗證失敗!';
    logApiError({ error, message });

    throw { message };
  }
};

export const deleteUser = async ({ _id }: DeleteUserDto): Promise<UserUpdateReturnType> => {
  try {
    const { data } = await apiOrigin.delete(`/delete-user`, {
      data: { _id },
    });

    return {
      message: data.message,
    };
  } catch (error) {
    const message = '刪除帳號失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const getMe = async ({ _id }: GetUserDto): Promise<UserLoginReturnType> => {
  try {
    const { data } = await apiOrigin.get('/get-me', {
      params: { _id },
    });
    return data;
  } catch (error) {
    const message = '找不到帳號!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};
