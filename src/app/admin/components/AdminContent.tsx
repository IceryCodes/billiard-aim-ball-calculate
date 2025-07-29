// 更新後的 AdminContent.tsx

'use client';

import { ReactNode, useCallback, useMemo, useState } from 'react';

import { useToast } from '@/contexts/ToastContext';
import { CourtProps, GetCourtsDto } from '@/domains/court';
import { GetUsersDto, UserProps } from '@/domains/user';
import { useArticleTwoStepMutation } from '@/features/articles/hooks/useArticleTwoStepMutation';
import { useFetchRSSMutation } from '@/features/articles/hooks/useFetchRSSMutation';
import { useGenerateFromCacheMutation } from '@/features/articles/hooks/useGenerateFromCacheMutation';
import { useCourtsQuery } from '@/features/courts/hooks/useCourtsQuery';
import { useUserQuery } from '@/features/user/hooks/useUserQuery';
import { useUsersQuery } from '@/features/user/hooks/useUsersQuery';
import { Button } from '@/global-components/buttons/Button';
import Card from '@/global-components/Card';
import useAdminProtected from '@/hooks/utils/protections/routes/useAdminProtected';

import ItemsSearch from './ItemsSearch';
import ItemsSelect from './ItemsSelect';
import UserRoleAssign from './UserRoleAssign';
import UsersSearch from './UsersSearch';
import UsersSelect from './UsersSelect';

const limit = 50;

const AdminContent = (): ReactNode => {
  useAdminProtected();
  const { showToast } = useToast();

  // 新增狀態管理
  const [fetchResult, setFetchResult] = useState<{
    cachedCount: number;
    items: { title: string; sourceUrl: string; publishedDate: string }[];
  } | null>(null);

  // 新增選擇新聞的狀態
  const [selectedNewsItems, setSelectedNewsItems] = useState<string[]>([]);

  // Separate search params for each manage type
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

  // 修正後的mutation hooks，加入適當的錯誤處理
  const { mutateAsync: fetchRSS, isLoading: isFetching } = useFetchRSSMutation({
    onSuccess: ({ message, cachedCount, items }) => {
      showToast({ message });
      setFetchResult({ cachedCount, items: items || [] });
      setSelectedNewsItems([]); // 清空之前的選擇
    },
    onError: (error) => {
      console.error('RSS fetch error:', error);
      showToast({ message: 'RSS獲取失敗' });
      setFetchResult(null);
      setSelectedNewsItems([]);
    },
  });

  const { mutateAsync: generateFromCache, isLoading: isGenerating } = useGenerateFromCacheMutation({
    onSuccess: ({ message }) => {
      showToast({ message });
      setFetchResult(null); // 清除快取狀態
      setSelectedNewsItems([]); // 清空選擇
    },
    onError: (error) => {
      console.error('Generate from cache error:', error);
      showToast({ message: '從快取生成文章失敗' });
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

  // Queries for each type
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

  // Handle court searches
  const handleManageSearch = useCallback(
    async (formData: GetCourtsDto) => {
      setCourtsSearch(formData);
      refetchCourts();
    },
    [refetchCourts]
  );

  // Handle user search separately
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

  // Combine lists while removing duplicates
  const combinedList = useMemo((): CourtProps[] => {
    return [...selectedItems, ...courts].filter((item, index, self) => index === self.findIndex((t) => t._id === item._id));
  }, [courts, selectedItems]);

  // 處理新聞項目選擇
  const handleNewsItemToggle = useCallback((sourceUrl: string) => {
    setSelectedNewsItems((prev) => {
      if (prev.includes(sourceUrl)) {
        return prev.filter((item) => item !== sourceUrl);
      } else {
        return [...prev, sourceUrl];
      }
    });
  }, []);

  // 全選/全不選
  const handleSelectAllNews = useCallback(() => {
    if (!fetchResult) return;

    if (selectedNewsItems.length === fetchResult.items.length) {
      setSelectedNewsItems([]);
    } else {
      setSelectedNewsItems(fetchResult.items.map((item) => item.sourceUrl));
    }
  }, [fetchResult, selectedNewsItems.length]);

  // 處理步驟一：獲取RSS
  const handleFetchRSS = useCallback(async () => {
    try {
      setFetchResult(null);
      setSelectedNewsItems([]);
      await fetchRSS();
    } catch (error) {
      console.error('Handle fetch RSS error:', error);
    }
  }, [fetchRSS]);

  // 處理步驟二：生成文章（支援選擇新聞）
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

  // 處理一鍵執行
  const handleOneClickGenerate = useCallback(async () => {
    try {
      setFetchResult(null);
      setSelectedNewsItems([]);
      await generateTwoStep();
    } catch (error) {
      console.error('Handle one click generate error:', error);
    }
  }, [generateTwoStep]);

  return (
    <div className="p-4 flex flex-col justify-center gap-y-4 w-full">
      {/* 文章生成區域 */}
      <Card className="p-4">
        <div className="flex flex-col gap-y-4">
          <h3 className="text-lg font-semibold ">文章生成管理</h3>

          {/* 一鍵生成按鈕 */}
          <div className="flex flex-col gap-y-2">
            <Button
              text={`${isTwoStepLoading ? '生成中...' : '一鍵生成文章'}`}
              onClick={handleOneClickGenerate}
              disabled={isTwoStepLoading || isFetching || isGenerating}
            />
            <p className="text-sm">自動執行RSS獲取和文章生成</p>
          </div>

          {/* 分步驟操作 */}
          <div className="border-t pt-4">
            <h4 className="text-md font-medium  mb-3">手動分步驟操作</h4>
            <div className="flex flex-col gap-y-3">
              {/* 步驟一 */}
              <div className="flex items-center gap-x-4">
                <Button
                  text={`${isFetching ? '獲取中...' : '步驟一：獲取RSS'}`}
                  onClick={handleFetchRSS}
                  disabled={isFetching || isGenerating || isTwoStepLoading}
                  className="min-w-[140px]"
                />
                <span className="text-sm ">從RSS源獲取最新新聞並快取</span>
              </div>

              {/* 快取狀態顯示與新聞選擇 */}
              {fetchResult && (
                <div className="ml-4 p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">已快取 {fetchResult.cachedCount} 篇新聞</p>
                    {fetchResult.items.length > 0 && (
                      <button
                        onClick={handleSelectAllNews}
                        className="text-xs px-2 py-1 border rounded"
                        disabled={isGenerating || isTwoStepLoading}
                      >
                        {selectedNewsItems.length === fetchResult.items.length ? '全不選' : '全選'}
                      </button>
                    )}
                  </div>

                  {fetchResult.items.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs mb-2">請選擇要生成文章的新聞：</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {fetchResult.items.map((item, index) => (
                          <label key={index} className="flex items-start gap-2 text-sm cursor-pointer p-1 rounded">
                            <input
                              type="checkbox"
                              checked={selectedNewsItems.includes(item.sourceUrl)}
                              onChange={() => handleNewsItemToggle(item.sourceUrl)}
                              disabled={isGenerating || isTwoStepLoading}
                              className="mt-1 flex-shrink-0"
                            />
                            <span className="flex-1 text-sm">{item.title}</span>
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

              {/* 步驟二 */}
              <div className="flex items-center gap-x-4">
                <Button
                  text={`${isGenerating ? '生成中...' : '步驟二：生成文章'}`}
                  onClick={handleGenerateFromCache}
                  disabled={
                    isGenerating ||
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

      {/* 原有的用戶管理區域保持不變 */}
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
