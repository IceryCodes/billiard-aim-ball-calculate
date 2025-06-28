'use server';

import { SignJWT, jwtVerify } from 'jose';
import { JWTExpired } from 'jose/errors';

import { UserRoleType } from '@/domains/interface';
import { UserManageProps } from '@/domains/manage';
import { UserProps } from '@/domains/user';

import { AuthError } from './errors';

const JWT_SECRET = process.env.JWT_SECRET;

export interface TokenProps {
  user: UserProps;
  manage: UserManageProps;
}

interface GenerateTokenProps {
  user: UserProps;
  manage: UserManageProps;
  isRegister?: boolean;
}

interface VerifyTokenProps {
  token: string;
  isRegister?: boolean;
}

interface IsManagerTokenProps {
  authHeader: string | undefined;
  pageId: string;
}

export const generateToken = async ({ user, manage, isRegister = false }: GenerateTokenProps): Promise<string> => {
  if (!JWT_SECRET) {
    throw new AuthError('JWT secret is missing', 'CONFIG_ERROR', 500);
  }

  // 驗證輸入資料的完整性
  const baseFields: (keyof UserProps)[] = ['_id', 'email'];
  const requiredFields = isRegister ? baseFields : [...baseFields, 'role', 'isVerified'];
  const isValid = user && requiredFields.every((field) => user[field as keyof UserProps] != null);

  if (!isValid) {
    throw new AuthError('無效的使用者資料', 'INVALID_USER_DATA');
  }

  if (!manage || !Array.isArray(manage.gamers)) {
    throw new AuthError('無效的管理資料', 'INVALID_MANAGE_DATA');
  }

  // 將 ObjectId 轉換為字串格式，避免在 JWT 中出現 buffer
  const userForToken = {
    ...user,
    _id: user._id.toString(), // 確保 _id 是字串格式
  };

  const manageForToken = {
    ...manage,
    gamers: manage.gamers.map((gamer) => ({
      ...gamer,
      _id: gamer._id.toString(), // 確保 gamer._id 也是字串格式
    })),
  };

  const secretKey = new TextEncoder().encode(JWT_SECRET);
  const now = Math.floor(Date.now() / 1000);

  try {
    const token = await new SignJWT({
      user: userForToken,
      manage: manageForToken,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt(now)
      .setExpirationTime(now + 3600 * 24) // 1小時*24後過期
      .sign(secretKey);

    return token;
  } catch (error) {
    console.error('Token generation failed:', error);
    throw new AuthError('產生 Token 失敗', 'TOKEN_GENERATION_FAILED');
  }
};

export const verifyToken = async ({ token, isRegister }: VerifyTokenProps): Promise<TokenProps> => {
  if (!JWT_SECRET) {
    throw new AuthError('JWT secret is missing', 'CONFIG_ERROR', 500);
  }

  if (!token || typeof token !== 'string') {
    throw new AuthError('無效的 Token 格式', 'INVALID_TOKEN_FORMAT');
  }

  const secretKey = new TextEncoder().encode(JWT_SECRET);

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      clockTolerance: 30, // 允許30秒的時間誤差
      algorithms: ['HS256'], // 明確指定演算法
    });

    if (!payload || typeof payload !== 'object') {
      throw new AuthError('無效的 Token 結構', 'INVALID_PAYLOAD_STRUCTURE');
    }

    const decodedPayload = payload as { user: UserProps; manage: UserManageProps };

    if (!decodedPayload.user || !decodedPayload.manage) {
      throw new AuthError('Token 缺少必要資料', 'MISSING_PAYLOAD_DATA');
    }

    // 確保 user 物件有所有必要的欄位
    const baseFields: (keyof UserProps)[] = ['_id', 'email'];
    const requiredFields = isRegister ? baseFields : [...baseFields, 'role', 'isVerified'];
    const isValid =
      decodedPayload.user && requiredFields.every((field) => decodedPayload.user[field as keyof UserProps] != null);

    if (!isValid) {
      throw new AuthError('Token 中的使用者資料無效', 'INVALID_USER_DATA_IN_TOKEN');
    }

    // 確保 manage 物件有所有必要的欄位
    if (!Array.isArray(decodedPayload.manage.gamers)) {
      throw new AuthError('Token 中的選手資料無效', 'INVALID_GAMERS_DATA_IN_TOKEN');
    }

    // 確保解碼後的資料中 _id 都是字串格式
    const userWithStringId = {
      ...decodedPayload.user,
      _id: decodedPayload.user._id.toString(),
    };

    const manageWithStringIds = {
      ...decodedPayload.manage,
      gamers: decodedPayload.manage.gamers.map((gamer) => ({
        ...gamer,
        _id: gamer._id.toString(),
      })),
    };

    return {
      user: userWithStringId,
      manage: manageWithStringIds,
    };
  } catch (error) {
    if (error instanceof JWTExpired) {
      throw new AuthError('登入已過期，請重新登入', 'TOKEN_EXPIRED');
    }

    if (error instanceof AuthError) {
      throw error;
    }

    // 其他未預期的錯誤
    console.error('Token verification failed:', error);
    throw new AuthError('驗證失敗，請重新登入', 'TOKEN_VERIFICATION_FAILED');
  }
};

export const isAdminToken = async (authHeader: string | undefined): Promise<boolean> => {
  if (!authHeader?.startsWith('Bearer ')) return false;

  try {
    const token = authHeader.split(' ')[1];
    const { user } = await verifyToken({ token });
    return user.role === UserRoleType.Admin;
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return false;
  }
};

export const isManagerToken = async ({ authHeader, pageId }: IsManagerTokenProps): Promise<boolean> => {
  if (!authHeader?.startsWith('Bearer ')) return false;

  try {
    const token = authHeader.split(' ')[1];
    const {
      user,
      manage: { gamers },
    } = await verifyToken({ token });

    if (user.role === UserRoleType.Admin) return true;

    // 確保 pageId 和 gamer._id 的比較都是字串格式
    return gamers.some((gamer) => gamer._id.toString() === pageId.toString());
  } catch (error) {
    console.error('Manager token verification failed:', error);
    return false;
  }
};
