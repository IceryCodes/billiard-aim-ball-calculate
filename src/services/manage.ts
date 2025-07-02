import { CreateManageDto } from '@/domains/manage';
import { apiOrigin, logApiError } from '@/utils/api';

import { ManageUpdateReturnType } from './interfaces';

export const updateManages = async (manages: CreateManageDto): Promise<ManageUpdateReturnType> => {
  try {
    const { data } = await apiOrigin.post(`/update-manage-courts`, manages);

    return {
      message: data.message,
    };
  } catch (error) {
    const message = '更新場地管理失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};
