import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

import { GetPaymentsReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';
import { verifyToken } from '@/utils/token';

const handler = async (req: NextApiRequest, res: NextApiResponse<GetPaymentsReturnType>) => {
  if (req.method !== 'GET') return res.status(HttpStatus.MethodNotAllowed).json({ message: 'Method not allowed' });

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.error('Unauthorized');
    return res.status(HttpStatus.Unauthorized).json({ message: 'Unauthorized' });
  }

  const { user } = await verifyToken({ token });

  if (!user) {
    console.error('User not found');
    return res.status(HttpStatus.NotFound).json({ message: '帳號不存在!' });
  }

  try {
    const { data, status } = await axios.post<GetPaymentsReturnType>(
      `${process.env.ICERY_API_URL}/payment/gets`,
      { userId: user._id },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': process.env.ICERY_API_KEY,
          Accept: 'application/json',
          Origin: process.env.NEXT_PUBLIC_BASE_URL,
        },
        timeout: 10000,
      }
    );

    if (status === HttpStatus.Ok) {
      res.status(HttpStatus.Ok).json(data);
    } else {
      res.status(HttpStatus.BadRequest).json({ message: '取得付款狀態失敗！' });
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
