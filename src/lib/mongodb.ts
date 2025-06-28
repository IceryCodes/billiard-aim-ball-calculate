import { Collection, MongoClient } from 'mongodb';

import { CourtDBProps } from '@/domains/court';
import { GamerDBProps } from '@/domains/gamer';
import { ManageDBProps } from '@/domains/manage';
import { PaymentProps } from '@/domains/payment';
import { TournamentDBProps } from '@/domains/tournament';
import { UserWithPasswordProps } from '@/domains/user';

const uri: string = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let clientPromise: Promise<MongoClient> | null = null;

// Reuse MongoClient connection across requests
export const connectToDatabase = async (): Promise<MongoClient> => {
  if (!clientPromise) {
    clientPromise = client.connect();
  }
  return clientPromise;
};

// Function to get the users collection
export const getUsersCollection = async (): Promise<Collection<Omit<UserWithPasswordProps, '_id'>>> => {
  const client = await connectToDatabase();
  const database = client.db('billiards');
  return database.collection<Omit<UserWithPasswordProps, '_id'>>('users');
};

// Function to get the gamers collection
export const getGamersCollection = async (): Promise<Collection<GamerDBProps>> => {
  const client = await connectToDatabase();
  const database = client.db('billiards');
  return database.collection<GamerDBProps>('gamers');
};

// Function to get the gamers collection with geospatial index
export const getGamersMapCollection = async (): Promise<Collection<GamerDBProps>> => {
  const client = await connectToDatabase();
  const database = client.db('billiards');
  const collection = database.collection<GamerDBProps>('gamers');

  await collection.createIndex(
    { location: '2dsphere' },
    {
      background: true, // 背景建立索引
      sparse: true, // 只索引有 location 欄位的文檔
    }
  );

  return collection;
};

// Function to get the gamer manages collection
export const getGamerManagesCollection = async (): Promise<Collection<ManageDBProps>> => {
  const client = await connectToDatabase();
  const database = client.db('billiards');
  return database.collection<ManageDBProps>('gamer_manages');
};

// Function to get the courts collection
export const getCourtsCollection = async (): Promise<Collection<CourtDBProps>> => {
  const client = await connectToDatabase();
  const database = client.db('billiards');
  return database.collection<CourtDBProps>('courts');
};

// Function to get the courts collection with geospatial index
export const getCourtsMapCollection = async (): Promise<Collection<CourtDBProps>> => {
  const client = await connectToDatabase();
  const database = client.db('billiards');
  const collection = database.collection<CourtDBProps>('courts');

  await collection.createIndex(
    { location: '2dsphere' },
    {
      background: true, // 背景建立索引
      sparse: true, // 只索引有 location 欄位的文檔
    }
  );

  return collection;
};

// Function to get the court manages collection
export const getCourtManagesCollection = async (): Promise<Collection<ManageDBProps>> => {
  const client = await connectToDatabase();
  const database = client.db('billiards');
  return database.collection<ManageDBProps>('court_manages');
};

// Function to get the payments collection
export const getPaymentsCollection = async (): Promise<Collection<PaymentProps>> => {
  const client = await connectToDatabase();
  const database = client.db('billiards');
  return database.collection<PaymentProps>('payments');
};

// Function to get the tournaments collection
export const getTournamentsCollection = async (): Promise<Collection<TournamentDBProps>> => {
  const client = await connectToDatabase();
  const database = client.db('billiards');
  return database.collection<TournamentDBProps>('tournaments');
};
