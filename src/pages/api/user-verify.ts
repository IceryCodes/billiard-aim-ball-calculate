import { ObjectId, UpdateResult } from 'mongodb';
import { NextApiRequest, NextApiResponse } from 'next';

import { UserWithPasswordProps } from '@/domains/user';
import { getUsersCollection } from '@/lib/mongodb';
import { UserVerifyReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';
import { TokenProps, verifyToken } from '@/utils/token';

const handler = async (req: NextApiRequest, res: NextApiResponse<UserVerifyReturnType>) => {
  const { token } = req.query;

  if (typeof token !== 'string') return res.status(HttpStatus.BadRequest).json({ message: 'Invalid body' });

  try {
    const { user }: TokenProps = await verifyToken({ token });

    const usersCollection = await getUsersCollection();
    const result: UpdateResult<Omit<UserWithPasswordProps, '_id'>> = await usersCollection.updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { isVerified: true } }
    );

    if (result.modifiedCount === 0) return res.status(HttpStatus.NotFound).json({ message: '驗證失效!' });

    res.status(HttpStatus.Ok).json({ message: '驗證成功!' });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
