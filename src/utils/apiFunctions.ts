import CryptoJS from 'crypto-js';
import { Collection, ObjectId, WithId } from 'mongodb';

import { CourtDBProps } from '@/domains/court';
import { ManageDBProps, UserManageProps } from '@/domains/manage';
import { PlayerDBProps } from '@/domains/player';
import { UserProps, UserWithPasswordProps } from '@/domains/user';
import {
  getCourtManagesCollection,
  getCourtsCollection,
  getPlayerManagesCollection,
  getPlayersCollection,
  getUsersCollection,
} from '@/lib/mongodb';

interface GetManageRecordsByCategoryIdProps {
  id: ObjectId;
}

export const getUserByUserId = async (userId: string): Promise<UserProps | null> => {
  const usersCollection: Collection<Omit<UserWithPasswordProps, '_id'>> = await getUsersCollection();

  // Find the user by _id
  const user: WithId<Omit<UserWithPasswordProps, '_id'>> | null = await usersCollection.findOne({
    _id: new ObjectId(userId),
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
  });

  if (!user) return null;

  return { ...user, _id: user._id.toString() };
};

export const getManageItemsByUserId = async (userId: string): Promise<UserManageProps> => {
  // Initialize collections
  const playerManageCollection: Collection<ManageDBProps> = await getPlayerManagesCollection();
  const playersCollection: Collection<PlayerDBProps> = await getPlayersCollection();
  const courtManageCollection: Collection<ManageDBProps> = await getCourtManagesCollection();
  const courtsCollection: Collection<CourtDBProps> = await getCourtsCollection();

  // Fetch manage records for players
  const playerManageRecords = await playerManageCollection.find({ userId }).toArray();
  const playerIds: ObjectId[] = playerManageRecords.map((record) => new ObjectId(record.itemId));

  const managedPlayers: WithId<PlayerDBProps>[] = await playersCollection
    .find({
      _id: { $in: playerIds },
    })
    .toArray();

  // Fetch manage records for courts
  const courtManageRecords = await courtManageCollection.find({ userId }).toArray();
  const courtIds: ObjectId[] = courtManageRecords.map((record) => new ObjectId(record.itemId));

  const managedCourts: WithId<CourtDBProps>[] = await courtsCollection
    .find({
      _id: { $in: courtIds },
    })
    .toArray();

  // Map records to IDs
  const manage: UserManageProps = {
    players: managedPlayers.map((player) => ({
      ...player,
      _id: player._id.toString(),
    })),
    courts: managedCourts.map((court) => ({
      ...court,
      _id: court._id.toString(),
    })),
  };

  return manage;
};

export const getManageCourtRecordsByCategoryId = async ({ id }: GetManageRecordsByCategoryIdProps): Promise<boolean> => {
  const getCollectionAndQuery = async () => {
    return {
      collection: await getCourtManagesCollection(),
      query: { court_id: id.toString() },
    };
  };

  const { collection, query } = await getCollectionAndQuery();
  const hasManager = (await collection.countDocuments(query)) > 0;
  return hasManager;
};

export const getManagePlayerRecordsByCategoryId = async ({ id }: GetManageRecordsByCategoryIdProps): Promise<boolean> => {
  const getCollectionAndQuery = async () => {
    return {
      collection: await getPlayerManagesCollection(),
      query: { player_id: id.toString() },
    };
  };

  const { collection, query } = await getCollectionAndQuery();
  const hasManager = (await collection.countDocuments(query)) > 0;
  return hasManager;
};

export const instoPayOrder: string[] = [
  'order_sn',
  'amount',
  'card_number',
  'security_code',
  'expiry_year',
  'expiry_month',
  'return_url',
  'time',
];

export const generate16CharId = (): string => {
  // 生成隨機的 WordArray
  const randomBytes = CryptoJS.lib.WordArray.random(8); // 8 bytes = 16 hex chars
  return randomBytes.toString(CryptoJS.enc.Hex);
};

export const updatePaymentOrder: string[] = [
  'type',
  'status',
  'order_sn',
  'charge_no',
  'amount',
  'fee',
  'foreign_card',
  'remark',
  'time',
];

export const generateUniqueCustomLink = async (
  title: string,
  courtsCollection: Collection<CourtDBProps>
): Promise<string> => {
  // 生成基礎 customLink
  const baseCustomLink = title
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[/?#[\]@!$&'()*:+,;="%<>`{}|^\\]/g, '')
    .trim();

  let customLink = baseCustomLink;
  let counter = 1;

  // 檢查是否重複，如果重複就加數字
  while (await courtsCollection.findOne({ customLink })) {
    customLink = `${baseCustomLink}${counter}`;
    counter++;
  }

  return customLink;
};
