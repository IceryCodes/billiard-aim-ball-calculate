import { ObjectId } from 'mongodb';
import { NextApiRequest, NextApiResponse } from 'next';

import { UserRoleType } from '@/domains/interface';
import { CreateManageDto, ManageDBProps } from '@/domains/manage';
import { getCourtManagesCollection, getUsersCollection } from '@/lib/mongodb';
import { HttpStatus } from '@/utils/api';
import { isAdminToken } from '@/utils/token';

const handler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  if (req.method !== 'POST') {
    return res.status(HttpStatus.MethodNotAllowed).json({ message: 'Method not allowed' });
  }

  try {
    const isAdmin = await isAdminToken(req.headers.authorization);
    if (!isAdmin) return res.status(HttpStatus.Forbidden).json({ message: 'Insufficient permissions' });
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(HttpStatus.Unauthorized).json({ message: 'Invalid token' });
  }

  // Extract request body and validate the payload type
  const { userId, itemIds }: CreateManageDto = req.body;

  if (!userId || !Array.isArray(itemIds)) return res.status(HttpStatus.BadRequest).json({ message: 'Invalid request body' });

  try {
    const userObjectId = new ObjectId(userId);
    const finalEntityObjectIds = itemIds.map((id) => new ObjectId(id));

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    });

    if (!user) {
      console.error('User not found');
      return res.status(HttpStatus.NotFound).json({ message: '帳號不存在!' });
    }

    const updateManagerRole = async () => {
      // Use Promise.all to count documents across all manage collections in parallel
      const [courtCount] = await Promise.all([(await getCourtManagesCollection()).countDocuments({ userId })]);

      // admin role protect
      if (user.role !== UserRoleType.Admin) {
        // Check if user should be assigned a Manager role
        const isManager = courtCount > 0;
        const userRole: UserRoleType = isManager ? UserRoleType.Manager : UserRoleType.None;

        // Update user role
        await usersCollection.updateOne({ _id: userObjectId }, { $set: { role: userRole } });
      }
    };

    const courtManagesCollection = await getCourtManagesCollection();

    const currentRecords = await courtManagesCollection.find({ userId }).toArray();
    const currentCourtIds = currentRecords.map((record) => record.itemId.toString());

    const toAdd = finalEntityObjectIds.filter((id) => !currentCourtIds.includes(id.toString()));
    const toRemove = currentCourtIds.filter((id) => !finalEntityObjectIds.some((entityId) => entityId.toString() === id));

    if (toAdd.length > 0) {
      const newCourtManages: ManageDBProps[] = toAdd.map((courtId) => ({
        _id: new ObjectId(),
        userId,
        itemId: courtId.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      await courtManagesCollection.insertMany(newCourtManages);
    }

    if (toRemove.length > 0) {
      await courtManagesCollection.deleteMany({
        userId,
        itemId: { $in: toRemove },
      });
    }

    // After making changes, update the user's role
    await updateManagerRole();

    return res.status(HttpStatus.Ok).json({
      message: '更新場地管理成功!',
    });
  } catch (error) {
    console.error('Error updating manage records:', error);
    return res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
