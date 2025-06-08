import { ObjectId } from 'mongodb';

export enum TournamentType {
  SINGLE = 'single',
  DOUBLE = 'double',
}

export enum PlayerCount {
  THIRTY_TWO = 32,
  SIXTY_FOUR = 64,
  ONE_HUNDRED_AND_TWENTY_EIGHT = 128,
}
// 基礎類型定義
export interface Player {
  id: number;
  name: string;
}

export interface Match {
  id: string;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
  round: number;
  matchIndex: number;
}

export interface TournamentState {
  players: Player[];
  matches: Match[];
  tournamentType: TournamentType;
  playerCount: PlayerCount;
}

export interface GetTournamentDto {
  customLink: string;
}

export interface GetTournamentsDto {
  page?: number;
  limit?: number;
}

export interface TournamentProps {
  _id: string;
  title: string;
  court: string;
  excerpt: string;
  content: string;
  featuredImg: string;
  customLink: string;
  tags: string[];
  tournament: TournamentState;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentDBProps extends Omit<TournamentProps, '_id'> {
  _id: ObjectId;
}

export type UpdateTournamentDto = TournamentProps;
