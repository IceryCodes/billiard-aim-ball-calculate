import { CreateTournamentProps, GetTournamentDto, GetTournamentsDto, UpdateTournamentDto } from '@/domains/tournament';
import { apiOrigin, logApiError } from '@/utils/api';

import { GetTournamentReturnType, GetTournamentsReturnType, TournamentUpdateReturnType } from './interfaces';

export const tournamentQueryKeys = {
  getTournament: 'getTournament',
  getTournaments: 'getTournaments',
} as const;

export const getTournament = async ({ customLink }: GetTournamentDto): Promise<GetTournamentReturnType> => {
  const encodedCustomLink = decodeURIComponent(customLink);

  try {
    const { data } = await apiOrigin.get('/get-tournament', {
      params: { customLink: encodedCustomLink },
    });

    return data;
  } catch (error) {
    const message = '搜尋球場賽程資料失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const getTournaments = async ({
  court = '',
  page = 1,
  limit = 10,
}: GetTournamentsDto): Promise<GetTournamentsReturnType> => {
  try {
    const { data } = await apiOrigin.get('/get-tournaments', {
      params: { court, page, limit },
    });

    return {
      tournaments: data.tournaments.length ? data.tournaments : [],
      total: data.total ? data.total : 0,
      message: 'Success',
    };
  } catch (error) {
    const message = '搜尋球場賽程資料失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const updateTournament = async (tournament: UpdateTournamentDto): Promise<TournamentUpdateReturnType> => {
  try {
    const { data } = await apiOrigin.patch(`/update-tournament`, tournament);

    return {
      message: data.message,
    };
  } catch (error) {
    const message = '更新球場賽程資料失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const createTournament = async (tournament: CreateTournamentProps): Promise<TournamentUpdateReturnType> => {
  try {
    const { data } = await apiOrigin.post(`/create-tournament`, tournament);

    return {
      message: data.message,
    };
  } catch (error) {
    const message = '新增球場賽程資料失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};
