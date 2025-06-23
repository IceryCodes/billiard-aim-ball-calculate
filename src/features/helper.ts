export const requestLimit = {
  // 重要：添加這些配置防止不必要的重新請求
  staleTime: 5 * 60 * 1000, // 5 分鐘內數據被視為新鮮的
  gcTime: 10 * 60 * 1000, // 10 分鐘後清除緩存
  refetchOnWindowFocus: false, // 視窗獲得焦點時不重新請求
  refetchOnMount: false, // 組件掛載時不重新請求
  refetchOnReconnect: false, // 網路重新連接時不重新請求
  retry: 1, // 失敗時只重試 1 次
};
