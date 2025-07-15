import { ReactNode, useState } from 'react';

import moment from 'moment';
import Image from 'next/image';
import Link from 'next/link';

import { TournamentContentFormatter } from '@/app/courts/[courtCustomLink]/tournaments/[customLink]/edit/components/TournamentShared';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { TournamentProps } from '@/domains/tournament';
import { useEnum } from '@/hooks/utils/useEnum';

interface TournamentListItemCardProps {
  image: string;
  tournament: TournamentProps;
}

const TournamentListItemCard = ({ image, tournament }: TournamentListItemCardProps): ReactNode => {
  const { title, excerpt, courtCustomLink, customLink, tags, courtTitle, tournament: tournamentData } = tournament;

  const { composeTournamentType } = useEnum();

  const [isHovered, setIsHovered] = useState<boolean>(false);

  return (
    <div className="group relative w-full">
      {/* 第三張票券 - 最底層 */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-500/80 to-slate-600/80 rounded-l-2xl transform rotate-2 group-hover:rotate-6 transition-all duration-500 shadow-lg"></div>

      {/* 第二張票券 - 中層 */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-500/80 to-gray-600/80 rounded-l-2xl transform rotate-1 group-hover:rotate-3 transition-all duration-500 shadow-lg"></div>

      {/* 主票券 */}
      <Link
        href={`${getPageUrlByType(PageType.COURTS)}/${courtCustomLink}${getPageUrlByType(PageType.TOURNAMENTS)}/${customLink}`}
        className="relative block bg-backgroundLight rounded-l-2xl shadow-2xl transform group-hover:-translate-y-4 group-hover:rotate-1 transition-all duration-500"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="p-4 md:p-6 h-full">
          {/* 票券打孔效果 */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-3 h-3 md:w-4 md:h-4 bg-backgroundLight rounded-full border-2 border-background"></div>

          <div className="flex items-start justify-between mb-3 md:mb-4">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-foreground opacity-60 mb-1 tracking-wider">
                {process.env.NEXT_PUBLIC_SITENAME}賽程門票
              </div>
              <h3 className="text-base md:text-lg font-bold text-foreground line-clamp-2 pr-2">{title}</h3>
            </div>
            <div className="text-right ml-2 flex-shrink-0">
              <div className="text-xs text-foreground opacity-60">報名費</div>
              <div className="text-lg md:text-xl font-bold text-link">${tournamentData.tournamentFee}</div>
            </div>
          </div>

          {/* 比賽圖片 with overlay and info */}
          <div className="mb-3 md:mb-4 rounded-lg overflow-hidden bg-backgroundLight relative">
            <Image
              src={image}
              alt={title}
              width={720}
              height={200}
              className="hidden md:flex w-full h-72 object-cover transition-transform duration-300 group-hover:scale-105"
              placeholder="blur"
              blurDataURL={image}
            />

            {/* Overlay 層 */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all duration-300"></div>

            {/* 比賽類型標籤 */}
            <div className="absolute top-2 left-4">
              <span className="inline-block px-2 py-1 bg-link text-background text-xs font-medium rounded-md">
                {composeTournamentType(tournamentData.tournamentType)}
              </span>
            </div>

            {/* 比賽資訊覆蓋在圖片上 */}
            <div className="absolute inset-0 p-4 flex flex-col justify-end">
              <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
                <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="icon icon-md text-white opacity-90">📅</span>
                    <span className="text-white">{`日期: ${moment(tournamentData.tournamentDate).format('YYYY/MM/DD')}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="icon icon-md text-white opacity-90">⏰</span>
                    <span className="text-white">
                      {`截止: ${moment(tournamentData.tournamentDeadlineDate).format('YYYY/MM/DD')}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="icon icon-md text-white opacity-90">📍</span>
                    <span className="text-white truncate">{courtTitle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="icon icon-md text-white opacity-90">👥</span>
                    <span className="text-white">{tournamentData.gamerCount} 人賽制</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 獎金詳情 */}
          <div className="mb-3 md:mb-4">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="medal-icon medal-gold mb-1"></div>
                <div className="text-foreground opacity-60">冠軍</div>
                <div className="font-bold text-foreground">${tournamentData.prizeFirst}</div>
              </div>
              <div className="text-center">
                <div className="medal-icon medal-silver mb-1"></div>
                <div className="text-foreground opacity-60">亞軍</div>
                <div className="font-bold text-foreground">${tournamentData.prizeSecond}</div>
              </div>
              <div className="text-center">
                <div className="medal-icon medal-bronze mb-1"></div>
                <div className="text-foreground opacity-60">季軍</div>
                <div className="font-bold text-foreground">${tournamentData.prizeThird}</div>
              </div>
            </div>
          </div>

          {/* 虛線分隔 + 標籤 */}
          <div className="border-t-2 border-dashed border-foreground opacity-20 pt-2 md:pt-3 mb-3 md:mb-4">
            <div className="flex flex-wrap gap-1">
              {tags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-backgroundLight border border-foreground border-opacity-20 text-foreground text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 摘要 */}
          <div
            className={`hidden mb-4 inset-0 transition-transform duration-300 overflow-hidden ${excerpt && isHovered ? 'h-[100px]' : 'h-0'}`}
          >
            <blockquote className="border-l-4 border-link pl-2 md:pl-3 italic text-sm">
              <TournamentContentFormatter content={excerpt} />
            </blockquote>
          </div>

          {/* 底部資訊 */}
          <div className="absolute bottom-3 md:bottom-4 left-4 md:left-6 right-4 md:right-6">
            <div className="flex items-center justify-between text-xs text-foreground opacity-60">
              <div className="flex items-center gap-4">
                {tournamentData.contactName && (
                  <div className="flex items-center gap-2">
                    <span className="icon">👤</span>
                    <span>{tournamentData.contactName}</span>
                  </div>
                )}
                {tournamentData.contactPhone && (
                  <div className="flex items-center gap-2">
                    <span className="icon">📞</span>
                    <span>{tournamentData.contactPhone}</span>
                  </div>
                )}
              </div>
              <div>#{customLink}</div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default TournamentListItemCard;
