import {
  CreateCourtDto,
  DeleteCourtDto,
  GetCourtDto,
  GetCourtsDto,
  GetCourtsMapDto,
  UpdateCourtDto,
  UpdateCourtViewDto,
} from '@/domains/court';
import { apiOrigin, logApiError } from '@/utils/api';

import { CourtUpdateReturnType, GetCourtReturnType, GetCourtsReturnType } from './interfaces';

export const courtQueryKeys = {
  getCourt: 'getCourt',
  getCourts: 'getCourts',
} as const;

export const getCourt = async ({ customLink }: GetCourtDto): Promise<GetCourtReturnType> => {
  try {
    const { data } = await apiOrigin.get('/get-court', {
      params: { customLink },
    });
    return data;
  } catch (error) {
    const message = '搜尋撞球場地失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const getCourts = async ({
  query,
  county,
  coaches,
  keywords,
  fullDay,
  partner,
  page = 1,
  limit = 10,
}: GetCourtsDto): Promise<GetCourtsReturnType> => {
  try {
    const { data } = await apiOrigin.get('/get-courts', {
      params: { query, county, coaches: coaches.join(','), keywords: keywords.join(','), fullDay, partner, page, limit },
    });

    return {
      courts: data.courts.length ? data.courts : [],
      total: data.total ? data.total : 0,
      message: 'Success',
    };
  } catch (error) {
    const message = '搜尋撞球場地失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const getCourtsMap = async ({ lat, lng, fullDay, partner }: GetCourtsMapDto): Promise<GetCourtReturnType> => {
  try {
    const { data } = await apiOrigin.get('/get-courts-map', {
      params: { lat, lng, fullDay, partner },
    });

    return data;
  } catch (error) {
    const message = '搜尋撞球場地失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const updateCourt = async (court: UpdateCourtDto): Promise<CourtUpdateReturnType> => {
  try {
    const { data } = await apiOrigin.patch(`/update-court`, court);

    return {
      message: data.message,
    };
  } catch (error) {
    const message = '更新撞球場地失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const updateCourtView = async (court: UpdateCourtViewDto): Promise<CourtUpdateReturnType> => {
  try {
    const { data } = await apiOrigin.post(`/update-court-view`, court);

    return {
      message: data.message,
    };
  } catch (error) {
    const message = '更新瀏覽次數失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const createCourt = async (court: CreateCourtDto): Promise<CourtUpdateReturnType> => {
  try {
    const { data } = await apiOrigin.post(`/create-court`, court);

    return {
      message: data.message,
    };
  } catch (error) {
    const message = '新增撞球場地失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const deleteCourt = async ({ _id }: DeleteCourtDto): Promise<CourtUpdateReturnType> => {
  try {
    const { data } = await apiOrigin.delete(`/delete-court`, {
      data: { _id },
    });

    return {
      message: data.message,
    };
  } catch (error) {
    const message = '刪除撞球場地失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};
