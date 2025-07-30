'use client';

import { ReactNode, useCallback, useMemo, useState } from 'react';

import moment from 'moment';

import { useToast } from '@/contexts/ToastContext';
import { CourtProps, GetCourtsDto } from '@/domains/court';
import { GetUsersDto, UserProps } from '@/domains/user';
import { useArticleGeneration } from '@/features/articles/hooks/useArticleGeneration';
import { useArticleTwoStepMutation } from '@/features/articles/hooks/useArticleTwoStepMutation';
import { useFetchRSSMutation } from '@/features/articles/hooks/useFetchRSSMutation';
import { useGenerateFromCacheMutation } from '@/features/articles/hooks/useGenerateFromCacheMutation';
import { useCourtsQuery } from '@/features/courts/hooks/useCourtsQuery';
import { useUserQuery } from '@/features/user/hooks/useUserQuery';
import { useUsersQuery } from '@/features/user/hooks/useUsersQuery';
import { Button } from '@/global-components/buttons/Button';
import Card from '@/global-components/Card';
import useAdminProtected from '@/hooks/utils/protections/routes/useAdminProtected';
import { useEnum } from '@/hooks/utils/useEnum';

import ItemsSearch from './ItemsSearch';
import ItemsSelect from './ItemsSelect';
import UserRoleAssign from './UserRoleAssign';
import UsersSearch from './UsersSearch';
import UsersSelect from './UsersSelect';

const limit = 50;

const AdminContent = (): ReactNode => {
  useAdminProtected();
  const { showToast } = useToast();
  const { composeArticleGenerationStatusType } = useEnum();

  const [fetchResult, setFetchResult] = useState<{
    cachedCount: number;
    items: { title: string; sourceUrl: string; publishedDate: Date }[];
  } | null>(null);

  const [selectedNewsItems, setSelectedNewsItems] = useState<string[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const initCourtSearchParams = useMemo(
    (): GetCourtsDto => ({
      query: '',
      county: '',
      keywords: [],
      fullDay: false,
      partner: false,
      coaches: [],
    }),
    []
  );

  const [usersSearch, setUsersSearch] = useState<GetUsersDto>({ email: '' });
  const [courtsSearch, setCourtsSearch] = useState<GetCourtsDto>(initCourtSearchParams);
  const [selectedUser, setSelectedUser] = useState<UserProps | null>(null);

  const { isConnected, currentStatus, currentMessage } = useArticleGeneration({
    jobId: currentJobId,
    enabled: isProcessing,
    onStatusUpdate: (message) => {
      if (process.env.NODE_ENV === 'development') console.info('📡 Status update:', message);
    },
    onComplete: (data) => {
      showToast({ message: `文章生成完成：${data.articleTitle}` });
      setIsProcessing(false);
      setCurrentJobId(null);
      setFetchResult(null);
      setSelectedNewsItems([]);
    },
    onError: (error) => {
      showToast({ message: `文章生成失敗：${error}` });
      setIsProcessing(false);
      setCurrentJobId(null);
    },
  });

  const { mutateAsync: fetchRSS, isLoading: isFetching } = useFetchRSSMutation({
    onSuccess: ({ message, cachedCount, items }) => {
      showToast({ message });
      setFetchResult({
        cachedCount,
        items: (items || []).map((item) => ({
          ...item,
          publishedDate: moment(item.publishedDate).toDate(),
        })),
      });
      setSelectedNewsItems([]);
    },
    onError: (error) => {
      console.error('RSS fetch error:', error);
      showToast({ message: 'RSS獲取失敗' });
      setFetchResult(null);
      setSelectedNewsItems([]);
    },
  });

  const { mutateAsync: generateFromCache, isLoading: isGeneratingOld } = useGenerateFromCacheMutation({
    onSuccess: ({ message, jobId }) => {
      if (jobId) {
        setCurrentJobId(jobId);
        setIsProcessing(true);
        showToast({ message: '文章生成已開始，請等待即時更新...' });
      } else {
        showToast({ message });
        setFetchResult(null);
        setSelectedNewsItems([]);
      }
    },
    onError: (error) => {
      console.error('Generate from cache error:', error);
      showToast({ message: '從快取生成文章失敗' });
      setIsProcessing(false);
      setCurrentJobId(null);
    },
  });

  const { mutateAsync: generateTwoStep, isLoading: isTwoStepLoading } = useArticleTwoStepMutation({
    onSuccess: ({ message }) => {
      showToast({ message });
      setFetchResult(null);
      setSelectedNewsItems([]);
    },
    onError: (error) => {
      console.error('Two step generate error:', error);
      showToast({ message: '兩步驟文章生成失敗' });
      setFetchResult(null);
      setSelectedNewsItems([]);
    },
  });

  const { data: userData, refetch: refetchUser } = useUserQuery({
    _id: selectedUser?._id,
    enabled: !!selectedUser?._id,
  });
  const [selectedItems, setSelectedItems] = useState<CourtProps[]>(userData?.manage?.courts ?? []);

  const { data: { users = [], total: totalUsers = 0 } = {}, refetch: refetchUsers } = useUsersQuery({
    email: usersSearch.email,
    enabled: !!usersSearch.email,
  });

  const { data: { courts = [], total: totalCourts = 0 } = {}, refetch: refetchCourts } = useCourtsQuery({
    query: courtsSearch.query,
    county: courtsSearch.county,
    coaches: courtsSearch.coaches,
    fullDay: courtsSearch.fullDay,
    partner: courtsSearch.partner,
    keywords: [],
    limit,
    enabled: !!courtsSearch.query,
  });

  const handleManageSearch = useCallback(
    async (formData: GetCourtsDto) => {
      setCourtsSearch(formData);
      refetchCourts();
    },
    [refetchCourts]
  );

  const handleUserSearch = useCallback(
    async (formData: GetUsersDto) => {
      if (formData.email) {
        setUsersSearch(formData);
        await refetchUsers();
      } else {
        setUsersSearch({ email: '' });
      }
      setSelectedUser(null);
    },
    [refetchUsers]
  );

  const combinedList = useMemo((): CourtProps[] => {
    return [...selectedItems, ...courts].filter((item, index, self) => index === self.findIndex((t) => t._id === item._id));
  }, [courts, selectedItems]);

  const handleNewsItemToggle = useCallback((sourceUrl: string) => {
    setSelectedNewsItems((prev) => {
      if (prev.includes(sourceUrl)) {
        return prev.filter((item) => item !== sourceUrl);
      } else {
        return [...prev, sourceUrl];
      }
    });
  }, []);

  const handleSelectAllNews = useCallback(() => {
    if (!fetchResult) return;

    if (selectedNewsItems.length === fetchResult.items.length) {
      setSelectedNewsItems([]);
    } else {
      setSelectedNewsItems(fetchResult.items.map((item) => item.sourceUrl));
    }
  }, [fetchResult, selectedNewsItems.length]);

  const handleFetchRSS = useCallback(async () => {
    try {
      setFetchResult(null);
      setSelectedNewsItems([]);
      await fetchRSS();
    } catch (error) {
      console.error('Handle fetch RSS error:', error);
    }
  }, [fetchRSS]);

  const handleGenerateFromCache = useCallback(async () => {
    if (!fetchResult || fetchResult.cachedCount === 0) {
      showToast({ message: '請先執行RSS獲取，且確保有快取的新聞資料' });
      return;
    }

    if (selectedNewsItems.length === 0) {
      showToast({ message: '請至少選擇一篇新聞' });
      return;
    }

    try {
      await generateFromCache({ selectedItems: selectedNewsItems });
    } catch (error) {
      console.error('Handle generate from cache error:', error);
    }
  }, [generateFromCache, fetchResult, selectedNewsItems, showToast]);

  const handleOneClickGenerate = useCallback(async () => {
    try {
      setFetchResult(null);
      setSelectedNewsItems([]);
      await generateTwoStep();
    } catch (error) {
      console.error('Handle one click generate error:', error);
    }
  }, [generateTwoStep]);

  const isAnyGenerating = isGeneratingOld || isProcessing;

  return (
    <div className="p-4 flex flex-col justify-center gap-y-4 w-full">
      <Card className="p-4">
        <div className="flex flex-col gap-y-4">
          <h3 className="text-lg font-semibold ">文章生成管理</h3>

          {isProcessing && (
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full animate-pulse bg-link"></div>
                <span className="text-sm font-medium">即時處理狀態</span>
                {isConnected && <span className="text-xs text-green-600">(已連線)</span>}
                {!isConnected && <span className="text-xs text-orange-600">(連線中...)</span>}
              </div>
              {currentStatus && (
                <div className="text-sm mb-1">
                  狀態：<span className="font-medium">{composeArticleGenerationStatusType(currentStatus)}</span>
                </div>
              )}
              {currentMessage && <div className="text-sm">{currentMessage}</div>}
            </div>
          )}

          <div className="flex flex-col gap-y-2">
            <Button
              text={`${isTwoStepLoading ? '生成中...' : '一鍵生成文章'}`}
              onClick={handleOneClickGenerate}
              disabled={isTwoStepLoading || isFetching || isAnyGenerating}
            />
            <p className="text-sm">自動執行RSS獲取和文章生成</p>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-md font-medium  mb-3">手動分步驟操作</h4>
            <div className="flex flex-col gap-y-3">
              <div className="flex items-center gap-x-4">
                <Button
                  text={`${isFetching ? '獲取中...' : '步驟一：獲取RSS'}`}
                  onClick={handleFetchRSS}
                  disabled={isFetching || isAnyGenerating || isTwoStepLoading}
                  className="min-w-[140px]"
                />
                <span className="text-sm ">從RSS源獲取最新新聞並快取</span>
              </div>

              {fetchResult && (
                <div className="ml-4 p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">已快取 {fetchResult.cachedCount} 篇新聞</p>
                    {fetchResult.items.length > 0 && (
                      <button
                        onClick={handleSelectAllNews}
                        className="text-xs px-2 py-1 border rounded"
                        disabled={isAnyGenerating || isTwoStepLoading}
                      >
                        {selectedNewsItems.length === fetchResult.items.length ? '全不選' : '全選'}
                      </button>
                    )}
                  </div>

                  {fetchResult.items.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs mb-2">請選擇要生成文章的新聞：</p>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {fetchResult.items.map((item, index) => (
                          <label key={index} className="flex items-start gap-2 text-sm cursor-pointer p-1 rounded">
                            <input
                              type="checkbox"
                              checked={selectedNewsItems.includes(item.sourceUrl)}
                              onChange={() => handleNewsItemToggle(item.sourceUrl)}
                              disabled={isAnyGenerating || isTwoStepLoading}
                              className="mt-1 flex-shrink-0"
                            />
                            <div className="flex-1">
                              <div className="text-sm">{item.title}</div>
                              <div className="text-xs">{moment(item.publishedDate).format('YYYY-MM-DD HH:mm')}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs mt-2">
                        已選擇 {selectedNewsItems.length} 篇新聞
                        {selectedNewsItems.length > 1 && <span>（將合併為一篇文章）</span>}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-x-4">
                <Button
                  text={`${isAnyGenerating ? '生成中...' : '步驟二：生成文章'}`}
                  onClick={handleGenerateFromCache}
                  disabled={
                    isAnyGenerating ||
                    isFetching ||
                    isTwoStepLoading ||
                    !fetchResult ||
                    fetchResult.cachedCount === 0 ||
                    selectedNewsItems.length === 0
                  }
                />
                <span className="text-sm ">從選中的新聞生成文章</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-x-4">
        <div className="flex flex-col min-w-[350px] gap-y-4">
          <Card>
            <div className="flex flex-col gap-y-2">
              <label>{`符合結果: ${totalUsers.toLocaleString()}筆`}</label>
              <UsersSearch searchUsers={handleUserSearch} />
              <UsersSelect
                users={users}
                selectedUser={selectedUser}
                user={userData?.user}
                setSelectedUser={setSelectedUser}
              />
            </div>
          </Card>
        </div>

        <Card className="flex flex-col w-full">
          {!selectedUser ? (
            <label className="text-red-400">請先選擇帳號</label>
          ) : (
            <>
              <label>{`符合結果: ${totalCourts.toLocaleString()}筆`}</label>
              <ItemsSearch searchItems={(formData) => handleManageSearch(formData)} />
              <ItemsSelect courts={combinedList} selectedItems={selectedItems} setSelectedItems={setSelectedItems} />
            </>
          )}
        </Card>
      </div>

      <UserRoleAssign
        selectedItems={selectedItems}
        userId={selectedUser?._id?.toString()}
        userName={`${selectedUser?.lastName}${selectedUser?.firstName}`}
        refetchUser={refetchUser}
      />
    </div>
  );
};

export default AdminContent;
