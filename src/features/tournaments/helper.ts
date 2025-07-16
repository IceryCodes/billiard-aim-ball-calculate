import { Edge, getNodesBounds, getViewportForBounds, ReactFlowInstance, Node as ReactFlowNode } from '@xyflow/react';
import { toPng } from 'html-to-image';
import { Collection } from 'mongodb';

import { ConnectionQualityType } from '@/app/courts/[courtCustomLink]/tournaments/[customLink]/edit/components/interfaces';
import { PlayerDBProps } from '@/domains/player';
import {
  AnnouncementMessage,
  DrawingUpdateMessage,
  GamerUpdateCompleteMessage,
  GamerUpdateSingleMessage,
  MatchUpdateMessage,
  RealtimeMessage,
  TestUpdateMessage,
  TournamentUpdatedMessage,
} from '@/domains/realtime';
import {
  Gamer,
  GamerCountType,
  GameTypesType,
  Match,
  RealtimeMessageType,
  TournamentDBProps,
  TournamentProps,
  TournamentState,
  TournamentType,
} from '@/domains/tournament';
import { TournamentFormData } from '@/global-components/buttons/TournamentFormButton';

interface ComposeStatusDisplayProps {
  isConnected: boolean;
  connectionQuality: ConnectionQualityType;
  isEditMode: boolean;
}

// 更新的 generateTournament 參數介面
interface GenerateTournamentProps {
  gamerCount: GamerCountType;
  tournamentType: TournamentType;
  tournamentDate: Date;
  tournamentDeadlineDate: Date;
  tournamentFee: number;
  prizeFirst: number;
  prizeSecond: number;
  prizeThird: number;
  contactName?: string;
  contactPhone?: string;
  defaultGames: number;
  gameType: GameTypesType;
}

export const isGamerUpdateComplete = (message: RealtimeMessage): message is GamerUpdateCompleteMessage => {
  return message.type === RealtimeMessageType.GAMER_UPDATE && 'gamers' in (message.data || {});
};

export const isGamerUpdateSingle = (message: RealtimeMessage): message is GamerUpdateSingleMessage => {
  return (
    message.type === RealtimeMessageType.GAMER_UPDATE &&
    'gamerId' in (message.data || {}) &&
    'gamerName' in (message.data || {})
  );
};

export const isMatchUpdate = (message: RealtimeMessage): message is MatchUpdateMessage => {
  return message.type === RealtimeMessageType.MATCH_UPDATE && 'matches' in (message.data || {});
};

export const isTournamentUpdated = (message: RealtimeMessage): message is TournamentUpdatedMessage => {
  return message.type === RealtimeMessageType.TOURNAMENT_UPDATED;
};

export const isAnnouncement = (message: RealtimeMessage): message is AnnouncementMessage => {
  return message.type === RealtimeMessageType.ANNOUNCEMENT && 'message' in message;
};

export const isTestUpdate = (message: RealtimeMessage): message is TestUpdateMessage => {
  return message.type === RealtimeMessageType.TEST_UPDATE && 'message' in message;
};

export const isDrawingUpdate = (message: RealtimeMessage): message is DrawingUpdateMessage => {
  return message.type === RealtimeMessageType.DRAWING_UPDATE && 'drawingData' in (message.data || {});
};

export const composeStatusDisplay = ({ isConnected, connectionQuality, isEditMode }: ComposeStatusDisplayProps) => {
  if (!isConnected) {
    return {
      icon: '❌',
      text: isEditMode ? '即時廣播已斷開' : '即時更新已斷開',
      color: 'text-red-600',
      dotColor: 'bg-red-500',
    };
  }

  if (connectionQuality === 'poor') {
    return {
      icon: '⚠️',
      text: isEditMode ? '即時廣播連線不穩' : '即時更新連線不穩',
      color: 'text-yellow-600',
      dotColor: 'bg-yellow-500',
    };
  }

  return {
    icon: '🔄',
    text: isEditMode ? '即時廣播已啟用' : '即時更新已啟用',
    color: isEditMode ? 'text-blue-600' : 'text-green-600',
    dotColor: 'bg-green-500',
  };
};

export const generateRandomCode = (length = 4): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
};

export const generateUniqueCustomLink = async (
  collection: Collection<TournamentDBProps> | Collection<PlayerDBProps>,
  providedCustomLink?: string,
  maxAttempts = 10
): Promise<string> => {
  let customLink = providedCustomLink;
  let attempts = 0;

  // 如果使用者有提供 customLink，先檢查是否已存在
  if (customLink) {
    const existingTournament = await collection.findOne({ customLink });
    if (!existingTournament) {
      return customLink; // 使用者提供的 customLink 是唯一的，直接使用
    }
    // 如果已存在，則拋出錯誤或生成新的（這裡選擇拋出錯誤）
    throw new Error(`自訂連結 "${customLink}" 已存在，請使用其他名稱`);
  }

  // 生成隨機 customLink 直到找到唯一的
  while (attempts < maxAttempts) {
    customLink = generateRandomCode();

    const existingTournament = await collection.findOne({ customLink });

    if (!existingTournament) {
      return customLink; // 找到唯一的 customLink
    }

    attempts++;
  }

  // 如果達到最大嘗試次數仍未找到唯一的 customLink
  throw new Error(`無法生成唯一的連結代碼，請稍後再試（已嘗試 ${maxAttempts} 次）`);
};

export const generateTournament = ({
  gamerCount,
  tournamentType,
  tournamentDate,
  tournamentDeadlineDate,
  tournamentFee,
  prizeFirst,
  prizeSecond,
  prizeThird,
  contactName,
  contactPhone,
  defaultGames,
  gameType,
}: GenerateTournamentProps): TournamentState => {
  // 檢查是否為2的冪次方
  if (!Number.isInteger(Math.log2(gamerCount))) {
    throw new Error('玩家數量必須是2的冪次方 (2, 4, 8, 16, 32, 64...)');
  }

  // 產生玩家
  const gamers: Gamer[] = Array.from({ length: gamerCount }, (_, index) => ({
    id: index + 1,
    name: '',
    games: defaultGames,
  }));

  const matches: Match[] = [];
  let currentRoundGamers = gamerCount;
  let round = 1;

  while (currentRoundGamers > 1) {
    const matchesInRound = currentRoundGamers / 2;

    for (let i = 0; i < matchesInRound; i++) {
      const match: Match = {
        id: `round${round}-match${i}`,
        gamer1: null,
        gamer2: null,
        winner: null,
        round,
        matchIndex: i,
      };

      // 第一輪直接分配玩家
      if (round === 1) {
        match.gamer1 = gamers[i * 2];
        match.gamer2 = gamers[i * 2 + 1];
      }

      matches.push(match);
    }

    currentRoundGamers = matchesInRound;
    round++;
  }

  return {
    gamerCount,
    gamers,
    matches,
    tournamentType,
    tournamentDate,
    tournamentDeadlineDate,
    tournamentFee,
    prizeFirst,
    prizeSecond,
    prizeThird,
    contactName,
    contactPhone,
    defaultGames,
    gameType,
  };
};

export const convertTournamentDates = (tournament: TournamentState) => {
  return {
    ...tournament,
    ...(tournament.tournamentDate && {
      tournamentDate: new Date(tournament.tournamentDate),
    }),
    ...(tournament.tournamentDeadlineDate && {
      tournamentDeadlineDate: new Date(tournament.tournamentDeadlineDate),
    }),
  };
};

export const downloadImage = async (
  reactFlowInstance: ReactFlowInstance<ReactFlowNode, Edge>,
  fileName: string
): Promise<void> => {
  try {
    const nodes = reactFlowInstance.getNodes();
    const nodesBounds = getNodesBounds(nodes);

    const imageWidth = 1920;
    const imageHeight = 1080;
    const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2, 0.1);

    const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!viewportElement) {
      console.error('React Flow viewport element not found');
      return;
    }

    const dataUrl = await toPng(viewportElement, {
      backgroundColor: '#1F2937',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    });

    const link = document.createElement('a');

    const finalFileName = `${fileName}賽程表 - ${process.env.NEXT_PUBLIC_SITENAME}.png`;

    link.setAttribute('download', finalFileName);
    link.setAttribute('href', dataUrl);
    link.click();
  } catch (error) {
    console.error('Failed to download image:', error);
  }
};

// 轉換 tournament 資料為表單格式
export const tournamentToFormData = (tournament: TournamentProps): TournamentFormData => ({
  title: tournament.title,
  featuredImg: tournament.featuredImg,
  excerpt: tournament.excerpt,
  content: tournament.content,
  customLink: tournament.customLink,
  court: tournament.court,
  courtTitle: tournament.courtTitle,
  courtCustomLink: tournament.courtCustomLink,
  gamerCount: tournament.tournament.gamerCount,
  tournament: {
    tournamentDate: tournament.tournament.tournamentDate,
    tournamentDeadlineDate: tournament.tournament.tournamentDeadlineDate,
    tournamentType: tournament.tournament.tournamentType,
    tournamentFee: tournament.tournament.tournamentFee,
    prizeFirst: tournament.tournament.prizeFirst,
    prizeSecond: tournament.tournament.prizeSecond,
    prizeThird: tournament.tournament.prizeThird,
    contactName: tournament.tournament.contactName || '',
    contactPhone: tournament.tournament.contactPhone || '',
    defaultGames: tournament.tournament.defaultGames,
    gameType: tournament.tournament.gameType,
  },
});
