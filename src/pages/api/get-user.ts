import { NextApiRequest, NextApiResponse } from 'next';

import { UserManageProps } from '@/domains/manage';
import { UserProps } from '@/domains/user';
import { GetUserReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';
import { getManageItemsByUserId, getUserByUserId } from '@/utils/apiFunctions';

const handler = async (req: NextApiRequest, res: NextApiResponse<GetUserReturnType>) => {
  if (req.method !== 'GET') return res.status(HttpStatus.MethodNotAllowed).json({ message: 'Method not allowed' });

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.error('Unauthorized');
    return res.status(HttpStatus.Unauthorized).json({ message: 'Unauthorized' });
  }

  const { _id } = req.query;

  if (typeof _id !== 'string') {
    return res.status(HttpStatus.BadRequest).json({ message: 'Invalid body' });
  }

  try {
    // Find the user by _id
    const user: UserProps | null = await getUserByUserId(_id);

    if (!user) {
      console.error('User not found');
      return res.status(HttpStatus.NotFound).json({ message: '帳號不存在!' });
    }

    const manage: UserManageProps = await getManageItemsByUserId(_id);

    // Return user details with managed gamers
    res.status(HttpStatus.Ok).json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      manage: {
        gamers: manage.gamers.map((gamer) => ({
          ...gamer,
          _id: gamer._id.toString(),
        })),
        courts: manage.courts.map((court) => ({
          ...court,
          _id: court._id.toString(),
        })),
      },
      message: 'Success',
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
