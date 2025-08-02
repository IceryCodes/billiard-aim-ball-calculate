'use client';
import { ReactNode } from 'react';

import Image from 'next/image';
import { useParams } from 'next/navigation';

import SidebarLayout from '@/app/players/[playerCustomLink]/components/SidebarLayout';
import { defaultPlayerExcerpt } from '@/domains/metadatas';
import { usePlayerQuery } from '@/features/players/hooks/usePlayerQuery';
import Breadcrumb from '@/global-components/Breadcrumb';
import Card from '@/global-components/Card';
import { PlayerForm, PlayerFormMode } from '@/global-components/forms/PlayerForm';
import ManagerPlayerProtected from '@/hooks/utils/protections/components/ManagerPlayerProtected';
import { useEnum } from '@/hooks/utils/useEnum';

const PlayerContent = (): ReactNode => {
  const params = useParams();
  const { composeGender } = useEnum();
  const playerCustomLink: string = params?.playerCustomLink as string;

  const { data: { player } = {}, isLoading, isError, refetch } = usePlayerQuery({ customLink: playerCustomLink });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-link border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <span className="text-foreground text-lg">載入中...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <span className="text-foreground text-lg">搜尋時發生錯誤</span>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎱</div>
          <span className="text-foreground text-lg">沒有符合的撞球選手</span>
        </div>
      </div>
    );
  }

  const {
    _id,
    county,
    district,
    title,
    excerpt,
    content,
    featuredImg,
    gender,
    gameTypes,
    professional,
    licenses,
    phone,
    email,
    websiteUrl,
  } = player;

  const usedExcerpt: string = excerpt ? excerpt : defaultPlayerExcerpt(player);

  return (
    <div className="min-h-screen bg-background">
      <SidebarLayout pageId={_id} county={county}>
        <div className="container mx-auto space-y-6">
          <div className="mb-6">
            <Breadcrumb pageName={title} />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Player Quote */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hero Section */}
              <div className="relative">
                <div className="relative h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src={
                      featuredImg
                        ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_PLAYER_FEATURED_FOLDER}/${featuredImg}`
                        : process.env.NEXT_PUBLIC_FEATURED_IMAGE
                    }
                    alt={title}
                    fill
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL={
                      featuredImg
                        ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_PLAYER_FEATURED_FOLDER}/${featuredImg}`
                        : process.env.NEXT_PUBLIC_FEATURED_IMAGE
                    }
                  />

                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between">
                      <div>
                        <h1 className="text-white text-2xl md:text-4xl font-bold mb-2 drop-shadow-lg">{title}</h1>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <div className="inline-flex items-center bg-link/90 text-white px-3 py-1 rounded-full text-sm font-medium">
                            📍 {county}
                            {district && ` ${district}`}
                          </div>

                          {professional && (
                            <div className="inline-flex items-center bg-yellow-500/90 text-white px-3 py-1 rounded-full text-sm font-medium">
                              ⭐ 職業選手
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Card>
                <div className="flex items-start gap-4 mb-6 min-h-72">
                  <div className="text-4xl text-link">💬</div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground mb-3">選手簡介</h2>
                    <blockquote className="border-l-4 border-link pl-4 italic text-foreground/80 text-lg leading-relaxed">
                      {usedExcerpt}
                    </blockquote>
                  </div>
                </div>
              </Card>

              {/* Licenses Section */}
              {!!licenses.length && (
                <Card>
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="text-3xl">🏅</div>
                      <h2 className="text-2xl font-bold text-foreground">證照</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {licenses.map((license, index) => (
                        <div key={index} className="p-4 bg-backgroundLight rounded-lg border border-foreground/10">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">🎖️</div>
                            <div className="flex-1">
                              <h4 className="font-bold text-foreground mb-1">{license.type}</h4>
                              {license.date && (
                                <p className="text-foreground/50 text-xs mt-1">
                                  {new Date(license.date).toLocaleDateString('zh-TW')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Player Info */}
            <div className="space-y-6">
              {/* Player Details Card */}
              <Card>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-2xl">
                      <Image
                        src="/assets/icon.png"
                        alt="billiards icon"
                        width={24}
                        height={24}
                        blurDataURL="/assets/icon.png"
                      />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">選手資訊</h3>
                  </div>
                  <ManagerPlayerProtected pageId={player.customLink}>
                    <PlayerForm mode={PlayerFormMode.Edit} player={player} onSuccess={refetch} />
                  </ManagerPlayerProtected>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-backgroundLight">
                    <span className="text-foreground/70">姓名</span>
                    <span className="font-medium text-foreground">{title}</span>
                  </div>

                  {!!gender && (
                    <div className="flex justify-between items-center py-2 border-b border-backgroundLight">
                      <span className="text-foreground/70">性別</span>
                      <span className="font-medium text-foreground">{composeGender(gender)}</span>
                    </div>
                  )}

                  {county && (
                    <div className="flex justify-between items-center py-2 border-b border-backgroundLight">
                      <span className="text-foreground/70">地區</span>
                      <span className="font-medium text-foreground">
                        {county}
                        {district && ` ${district}`}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2 border-b border-backgroundLight">
                    <span className="text-foreground/70">類型</span>
                    <span className="font-medium text-foreground">{professional ? '職業選手' : '業餘選手'}</span>
                  </div>
                </div>
              </Card>

              {/* Game Types Card */}
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-2xl">🎯</div>
                  <h3 className="text-lg font-bold text-foreground">擅長項目</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {gameTypes.map((gameType, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center bg-link/10 text-link px-3 py-1 rounded-full text-sm font-medium border border-link/20"
                    >
                      {gameType}
                    </span>
                  ))}
                  {!gameTypes.length && <span className="text-foreground/50">無</span>}
                </div>
              </Card>

              {/* Contact Card */}

              <Card>
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <span className="text-2xl">📞</span>
                  聯絡資訊
                </h3>
                {phone || email || websiteUrl ? (
                  <div className="space-y-3">
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="w-full flex items-center gap-3 p-3 bg-link/10 hover:bg-link/20 border border-link/20 hover:border-link/40 rounded-lg transition-colors"
                      >
                        <span className="text-xl">📱</span>
                        <span className="text-foreground font-medium">{phone}</span>
                      </a>
                    )}
                    {email && (
                      <a
                        href={`mailto:${email}`}
                        className="w-full flex items-center gap-3 p-3 bg-backgroundLight hover:bg-backgroundLight/80 border border-foreground/10 hover:border-foreground/20 rounded-lg transition-colors"
                      >
                        <span className="text-xl">✉️</span>
                        <span className="text-foreground font-medium">{email}</span>
                      </a>
                    )}
                    {websiteUrl && (
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center gap-3 p-3 bg-backgroundLight hover:bg-backgroundLight/80 border border-foreground/10 hover:border-foreground/20 rounded-lg transition-colors"
                      >
                        <span className="text-xl">🌐</span>
                        <span className="text-foreground font-medium">個人網站</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <span>無</span>
                )}
              </Card>
            </div>
          </div>

          {/* About Section */}
          <Card>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="text-3xl">ℹ️</div>
                <h2 className="text-2xl font-bold text-foreground">關於{title}</h2>
              </div>

              <div className="prose prose-lg max-w-none">
                {content ? (
                  <div className="text-foreground/80 leading-relaxed text-lg whitespace-pre-wrap">{content}</div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 opacity-50">📝</div>
                    <p className="text-foreground/60 text-lg">
                      尚無關於 <span className="font-medium text-link">{title}</span> 的詳細資訊
                    </p>
                    <p className="text-foreground/50 mt-2">歡迎選手或管理員提供更多資訊補充！</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </SidebarLayout>
    </div>
  );
};

export default PlayerContent;
