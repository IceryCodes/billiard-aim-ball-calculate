'use client';

import { ReactElement, useCallback, useMemo } from 'react';

import moment from 'moment';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { TournamentProps } from '@/domains/tournament';
import { formatCurrency } from '@/features/tournaments/helper';
import { useTournamentState } from '@/features/tournaments/hooks/useTournamentState';
import DeleteTournamentContent from '@/global-components/buttons/DeleteTournamentButton';
import { TournamentFormButton, TournamentFormMode } from '@/global-components/buttons/TournamentFormButton';
import ManagerCourtProtected from '@/hooks/utils/protections/components/ManagerCourtProtected';
import { useEnum } from '@/hooks/utils/useEnum';

import ResponsiveTournamentDisplay from '../edit/components/ResponsiveTournamentDisplay';
import { ResponsiveWarning, TournamentContentFormatter, TournamentToast } from '../edit/components/TournamentShared';

interface TournamentBoardProps {
  tournamentData: TournamentProps;
  refetch: () => void;
}

const TournamentBoard = ({ tournamentData, refetch }: TournamentBoardProps): ReactElement => {
  const router = useRouter();
  const { composeTournamentType } = useEnum();

  const { currentTournament, toast, windowWidth, lastUpdateTime, isConnected, onlineCount, reconnect, connectionQuality } =
    useTournamentState({
      tournamentData,
      isEditMode: false,
    });

  const redirectToCourt = useCallback(() => {
    router.push(`${getPageUrlByType(PageType.COURTS)}/${currentTournament.courtCustomLink}`);
  }, [router, currentTournament.courtCustomLink]);

  const timeUntilDeadline = useMemo(() => {
    const isExpired = moment().isAfter(currentTournament.tournament.tournamentDeadlineDate);

    return {
      color: isExpired ? 'text-red-600' : 'text-green-600',
      text: isExpired ? '已結束' : '報名中',
    };
  }, [currentTournament.tournament.tournamentDeadlineDate]);

  const timeUntilTournament = useMemo(() => {
    const isExpired = moment().isAfter(currentTournament.tournament.tournamentDate);

    return {
      color: isExpired ? 'text-red-600' : 'text-green-600',
      text: isExpired ? '已完賽' : '未開賽',
    };
  }, [currentTournament.tournament.tournamentDate]);

  const totalPrize = useMemo(
    () =>
      currentTournament.tournament.prizeFirst +
      currentTournament.tournament.prizeSecond +
      currentTournament.tournament.prizeThird,
    [
      currentTournament.tournament.prizeFirst,
      currentTournament.tournament.prizeSecond,
      currentTournament.tournament.prizeThird,
    ]
  );
  const registeredCount = useMemo(
    () => currentTournament.tournament.gamers.filter((gamer) => !!gamer.name).length,
    [currentTournament.tournament.gamers]
  );

  const registrationProgress = useMemo(
    () => (registeredCount / currentTournament.tournament.gamerCount) * 100,
    [currentTournament.tournament.gamerCount, registeredCount]
  );
  const expectedRounds = useMemo(
    () => Math.ceil(Math.log2(currentTournament.tournament.gamerCount)),
    [currentTournament.tournament.gamerCount]
  );

  return (
    <main className="flex flex-col items-center gap-y-4">
      {/* Toast 通知 */}
      <TournamentToast toast={toast} />

      <ResponsiveTournamentDisplay
        tournamentData={currentTournament}
        isEditMode={false}
        connectionQuality={connectionQuality}
      />

      <article className="bg-gray-900 border border-gray-700 rounded-lg w-full">
        {/* 狀態列 */}
        <header className="bg-gray-800 px-4 py-2 border-b border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? '即時更新已啟用' : '連線中斷'}
                </span>
                {!isConnected && reconnect && (
                  <button
                    onClick={reconnect}
                    className="text-blue-600 hover:text-blue-800 underline text-xs bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                  >
                    重新連線
                  </button>
                )}
              </div>
              {isConnected && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-xs">👁️</span>
                  <span className="text-gray-400 text-xs">{onlineCount} 人在線</span>
                </div>
              )}
            </div>
            <p className="text-gray-400 text-xs">最後更新: {lastUpdateTime}</p>
          </div>
        </header>

        {/* 主要標題區 */}
        <section className="bg-gray-800 p-4 border-b border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded font-medium">
                  {composeTournamentType(currentTournament.tournament.tournamentType)}
                </span>
                <span className="px-2 py-1 bg-gray-600 text-gray-200 text-xs rounded">
                  {currentTournament.tournament.gameType}
                </span>
              </div>
              <div className="flex flex-row items-center gap-4">
                <h1 className="text-xl font-bold text-white mb-1">{currentTournament.title}</h1>
                <ManagerCourtProtected pageId={currentTournament.customLink}>
                  <TournamentFormButton mode={TournamentFormMode.Edit} tournament={currentTournament} onSuccess={refetch} />
                  <DeleteTournamentContent
                    _id={currentTournament._id}
                    tournamentTitle={currentTournament.title}
                    onSuccess={redirectToCourt}
                  />
                </ManagerCourtProtected>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <Link href={`${getPageUrlByType(PageType.COURTS)}/${currentTournament.courtCustomLink}`}>
                  {currentTournament.courtTitle}
                </Link>
                <span>•</span>
                <time dateTime={moment(currentTournament.tournament.tournamentDate).toISOString()}>
                  {moment(currentTournament.tournament.tournamentDate).format('YYYY/MM/DD')}
                </time>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalPrize)}</p>
              <p className="text-gray-400 text-sm">總獎金</p>
            </div>
          </div>
        </section>

        <div className="p-4">
          {/* 快速統計 */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-800 p-3 rounded text-center">
              <p className="text-lg font-bold text-white">
                {registeredCount}/{currentTournament.tournament.gamerCount}
              </p>
              <p className="text-gray-400 text-xs">報名狀況</p>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                <div
                  className="bg-orange-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${registrationProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-gray-800 p-3 rounded text-center">
              <p className="text-lg font-bold text-white">{formatCurrency(currentTournament.tournament.tournamentFee)}</p>
              <p className="text-gray-400 text-xs">報名費</p>
            </div>
            <div className="bg-gray-800 p-3 rounded text-center">
              <p className={`text-lg font-bold ${timeUntilDeadline.color}`}>{timeUntilDeadline.text}</p>
              <p className="text-gray-400 text-xs">報名倒數</p>
            </div>
            <div className="bg-gray-800 p-3 rounded text-center">
              <p className={`text-lg font-bold ${timeUntilTournament.color}`}>{timeUntilTournament.text}</p>
              <p className="text-gray-400 text-xs">比賽倒數</p>
            </div>
          </section>

          {/* 獎金分配 */}
          <section className="mb-4">
            <h2 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
              <span className="text-orange-500">🏆</span>
              獎金分配
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="bg-gradient-to-r from-[#ffd700] to-[#ffed4a] p-3 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-background">第一名</p>
                    <p className="text-xs opacity-90 text-background">
                      {((currentTournament.tournament.prizeFirst / totalPrize) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-lg font-bold text-background">
                    {formatCurrency(currentTournament.tournament.prizeFirst)}
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-[#c0c0c0] to-[#e5e5e5] p-3 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-background">第二名</p>
                    <p className="text-xs opacity-90 text-background">
                      {((currentTournament.tournament.prizeSecond / totalPrize) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-lg font-bold text-background">
                    {formatCurrency(currentTournament.tournament.prizeSecond)}
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-[#cd7f32] to-[#d4a574] p-3 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-background">第三名</p>
                    <p className="text-xs opacity-90 text-background">
                      {((currentTournament.tournament.prizeThird / totalPrize) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-lg font-bold text-background">
                    {formatCurrency(currentTournament.tournament.prizeThird)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 詳細資訊網格 */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* 比賽資訊 */}
            <div className="bg-gray-800 p-3 rounded">
              <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <span className="text-orange-500">🎮</span>
                比賽資訊
              </h3>
              <dl className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <dt className="text-gray-400">比賽類型</dt>
                  <dd className="text-white">{composeTournamentType(currentTournament.tournament.tournamentType)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">比賽項目</dt>
                  <dd className="text-white">{currentTournament.tournament.gameType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">預設局數</dt>
                  <dd className="text-white">{currentTournament.tournament.defaultGames} 局</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">預計場次</dt>
                  <dd className="text-white">{currentTournament.tournament.matches.length} 場</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">預計輪數</dt>
                  <dd className="text-white">{expectedRounds} 輪</dd>
                </div>
              </dl>
            </div>

            {/* 時間資訊 */}
            <div className="bg-gray-800 p-3 rounded">
              <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <span className="text-orange-500">⏰</span>
                時間資訊
              </h3>
              <dl className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <dt className="text-gray-400">比賽開始</dt>
                  <dd className="text-white">
                    <time dateTime={moment(currentTournament.tournament.tournamentDate).toISOString()}>
                      {moment(currentTournament.tournament.tournamentDate).format('YYYY/MM/DD HH:mm')}
                    </time>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">報名截止</dt>
                  <dd className="text-white">
                    <time dateTime={moment(currentTournament.tournament.tournamentDeadlineDate).toISOString()}>
                      {moment(currentTournament.tournament.tournamentDeadlineDate).format('YYYY/MM/DD HH:mm')}
                    </time>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">創建時間</dt>
                  <dd className="text-white">
                    <time dateTime={moment(currentTournament.createdAt).toISOString()}>
                      {moment(currentTournament.createdAt).format('YYYY/MM/DD HH:mm')}
                    </time>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">最後更新</dt>
                  <dd className="text-white">
                    <time dateTime={moment(currentTournament.updatedAt).toISOString()}>
                      {moment(currentTournament.updatedAt).format('YYYY/MM/DD HH:mm')}
                    </time>
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* 聯絡資訊 */}
          <section className="bg-gray-800 p-3 rounded mb-4">
            <h2 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
              <span className="text-orange-500">📞</span>
              聯絡資訊
            </h2>
            <dl className="space-y-1 text-xs">
              {currentTournament.tournament.contactName && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">聯絡人</dt>
                  <dd className="text-white">{currentTournament.tournament.contactName}</dd>
                </div>
              )}
              {currentTournament.tournament.contactPhone && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">電話</dt>
                  <dd>
                    <a
                      href={`tel:${currentTournament.tournament.contactPhone}`}
                      className="text-orange-400 hover:text-orange-300"
                    >
                      {currentTournament.tournament.contactPhone}
                    </a>
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-400">比賽場地</dt>
                <dd>
                  <Link
                    href={`${getPageUrlByType(PageType.COURTS)}/${currentTournament.courtCustomLink}${getPageUrlByType(PageType.TOURNAMENTS)}/${currentTournament.customLink}`}
                    className="text-white hover:text-orange-300"
                  >
                    {currentTournament.courtTitle}
                  </Link>
                </dd>
              </div>
            </dl>
          </section>

          {/* 標籤區 */}
          {!!currentTournament.tags.length && (
            <section className="mb-4">
              <h2 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <span className="text-orange-500">🏷️</span>
                賽事標籤
              </h2>
              <ul className="flex flex-wrap gap-1">
                {currentTournament.tags.map((tag, index) => (
                  <li key={index} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded border border-gray-600">
                    {tag}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 簡介區 */}
          {currentTournament.excerpt && (
            <section className="mb-4">
              <h2 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <span className="text-orange-500">✏️</span>
                賽事簡介
              </h2>
              <div className="bg-gray-800 p-3 rounded">
                <TournamentContentFormatter content={currentTournament.excerpt} />
              </div>
            </section>
          )}

          {/* 詳細內容 */}
          {currentTournament.content && (
            <section className="mb-4">
              <h2 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <span className="text-orange-500">ℹ️</span>
                詳細內容
              </h2>
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                  <TournamentContentFormatter content={currentTournament.content} />
                </div>
              </div>
            </section>
          )}

          {/* 特色圖片區 */}
          {currentTournament.featuredImg && (
            <section className="mb-4">
              <div className="bg-gray-800 rounded-lg p-3 flex justify-center">
                <Image
                  src={`${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_TOURNAMENT_FEATURED_FOLDER}/${currentTournament.featuredImg}`}
                  alt={currentTournament.title}
                  width={512}
                  height={288}
                  className="w-fit h-full max-h-[600px] object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
                  placeholder="blur"
                  blurDataURL={`${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_TOURNAMENT_FEATURED_FOLDER}/${currentTournament.featuredImg}`}
                />
              </div>
            </section>
          )}
        </div>
      </article>

      <div className="w-full">
        <ResponsiveWarning windowWidth={windowWidth} />
      </div>
    </main>
  );
};

export default TournamentBoard;
