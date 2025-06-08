import { decodeJwt } from 'jose';
import type { NextApiRequest, NextApiResponse } from 'next';

import { UserManageProps } from '@/domains/manage';
import { HttpStatus } from '@/utils/api';
import { getManageItemsByUserId, getUserByUserId } from '@/utils/apiFunctions';
import { generateToken, TokenProps } from '@/utils/token';

interface RenewTokenResponse {
  token?: string;
  message?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<RenewTokenResponse>) {
  if (req.method !== 'POST') {
    return res.status(HttpStatus.MethodNotAllowed).json({ message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(HttpStatus.Unauthorized).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const {
      user: { _id },
    }: TokenProps = decodeJwt(token);

    if (!_id) {
      return res.status(HttpStatus.Unauthorized).json({ message: 'Invalid token' });
    }

    const [user, manage] = await Promise.all([
      getUserByUserId(_id),
      getManageItemsByUserId(_id) as Promise<UserManageProps>,
    ]);

    if (!user) {
      return res.status(HttpStatus.Unauthorized).json({ message: 'User not found' });
    }

    const newToken = await generateToken({ user, manage });
    return res.status(HttpStatus.Ok).json({ token: newToken });
  } catch (error) {
    console.error('Renew token error:', error);
    return res.status(HttpStatus.InternalServerError).json({
      message: `Token renewal failed: ${error}`,
    });
  }
}
