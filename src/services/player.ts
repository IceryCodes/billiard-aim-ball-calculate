import { CreatePlayerDto, DeletePlayerDto, GetPlayerDto, GetPlayersDto, UpdatePlayerDto } from '@/domains/player';
import { apiOrigin, logApiError } from '@/utils/api';

import { GetPlayerReturnType, GetPlayersReturnType, PlayerUpdateReturnType } from './interfaces';

export const playerQueryKeys = {
  getPlayer: 'getPlayer',
  getPlayers: 'getPlayers',
} as const;

export const getPlayer = async ({ customLink }: GetPlayerDto): Promise<GetPlayerReturnType> => {
  try {
    const { data } = await apiOrigin.get('/get-player', {
      params: { customLink },
    });
    return data;
  } catch (error) {
    const message = '搜尋撞球選手失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const getPlayers = async ({ query, page = 1, limit = 10 }: GetPlayersDto): Promise<GetPlayersReturnType> => {
  try {
    const { data } = await apiOrigin.get('/get-players', {
      params: { query, page, limit },
    });

    return {
      players: data.players.length ? data.players : [],
      total: data.total ? data.total : 0,
      message: 'Success',
    };
  } catch (error) {
    const message = '搜尋撞球選手失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const updatePlayer = async (player: UpdatePlayerDto): Promise<PlayerUpdateReturnType> => {
  try {
    const { data } = await apiOrigin.patch(`/update-player`, player);

    return {
      message: data.message,
    };
  } catch (error) {
    const message = '更新撞球選手失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const createPlayer = async (player: CreatePlayerDto): Promise<PlayerUpdateReturnType> => {
  try {
    const { data } = await apiOrigin.post(`/create-player`, player);

    return {
      message: data.message,
    };
  } catch (error) {
    const message = '新增撞球選手失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const deletePlayer = async ({ _id }: DeletePlayerDto): Promise<PlayerUpdateReturnType> => {
  try {
    const { data } = await apiOrigin.delete(`/delete-player`, {
      data: { _id },
    });

    return {
      message: data.message,
    };
  } catch (error) {
    const message = '刪除撞球選手失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};
