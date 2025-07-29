import { useCallback, useMemo } from 'react';

import { ArticleGenerationStatusType } from '@/domains/article-realtime';
import { GenderType, UserRoleType } from '@/domains/interface';
import { TournamentType } from '@/domains/tournament';

interface UsePatientSelectionTicketEnumReturnType {
  articleGenerationStatusTypeMap: Record<ArticleGenerationStatusType, string>;
  composeArticleGenerationStatusType: (typeToTrans: ArticleGenerationStatusType) => string;
  tournamentTypeMap: Record<TournamentType, string>;
  composeTournamentType: (typeToTrans: TournamentType) => string;
  roleMap: Record<UserRoleType, string>;
  composeRole: (typeToTrans: UserRoleType) => string;
  genderMap: Record<GenderType, string>;
  composeGender: (typeToTrans: GenderType) => string;
}

export const useEnum = (): UsePatientSelectionTicketEnumReturnType => {
  const articleGenerationStatusTypeMap = useMemo<Record<ArticleGenerationStatusType, string>>(() => {
    return {
      [ArticleGenerationStatusType.STARTING]: '開始生成',
      [ArticleGenerationStatusType.READING_CACHE]: '讀取資料',
      [ArticleGenerationStatusType.GENERATING]: '生成中',
      [ArticleGenerationStatusType.SAVING]: '儲存中',
      [ArticleGenerationStatusType.COMPLETED]: '已完成',
      [ArticleGenerationStatusType.ERROR]: '錯誤',
    };
  }, []);

  const composeArticleGenerationStatusType = useCallback(
    (roleToTrans: ArticleGenerationStatusType): string => {
      return articleGenerationStatusTypeMap[roleToTrans] ?? 'Unknown';
    },
    [articleGenerationStatusTypeMap]
  );

  const tournamentTypeMap = useMemo<Record<TournamentType, string>>(() => {
    return {
      [TournamentType.SINGLE]: '單敗制',
      [TournamentType.DOUBLE]: '雙敗制',
    };
  }, []);

  const composeTournamentType = useCallback(
    (roleToTrans: TournamentType): string => {
      return tournamentTypeMap[roleToTrans] ?? 'Unknown';
    },
    [tournamentTypeMap]
  );

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
      articleGenerationStatusTypeMap,
      composeArticleGenerationStatusType,
      tournamentTypeMap,
      composeTournamentType,
      roleMap,
      composeRole,
      genderMap,
      composeGender,
    };
  }, [
    articleGenerationStatusTypeMap,
    composeArticleGenerationStatusType,
    tournamentTypeMap,
    composeTournamentType,
    roleMap,
    composeRole,
    genderMap,
    composeGender,
  ]);
};
