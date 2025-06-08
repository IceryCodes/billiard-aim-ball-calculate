import { useCallback, useMemo } from 'react';

import { GenderType, UserRoleType } from '@/domains/interface';

interface UsePatientSelectionTicketEnumReturnType {
  roleMap: Record<UserRoleType, string>;
  composeRole: (genderToTrans: UserRoleType) => string;
  genderMap: Record<GenderType, string>;
  composeGender: (genderToTrans: GenderType) => string;
}

export const useEnum = (): UsePatientSelectionTicketEnumReturnType => {
  const roleMap = useMemo<Record<UserRoleType, string>>(() => {
    return {
      [UserRoleType.None]: '一般用戶',
      [UserRoleType.Admin]: '網站管理員',
      [UserRoleType.Manager]: '管理人員',
    };
  }, []);

  const composeRole = useCallback(
    (roleToTrans: UserRoleType): string => {
      return roleMap[roleToTrans] ?? 'Unknown';
    },
    [roleMap]
  );

  const genderMap = useMemo<Record<GenderType, string>>(() => {
    return {
      [GenderType.None]: '',
      [GenderType.Male]: '先生',
      [GenderType.Female]: '小姐',
    };
  }, []);

  const composeGender = useCallback(
    (genderToTrans: GenderType): string => {
      return genderMap[genderToTrans] ?? 'Unknown';
    },
    [genderMap]
  );

  return useMemo<UsePatientSelectionTicketEnumReturnType>(() => {
    return {
      roleMap,
      composeRole,
      genderMap,
      composeGender,
    };
  }, [roleMap, composeRole, genderMap, composeGender]);
};
