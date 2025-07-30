import moment from 'moment';
import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

import { RSSItem } from '@/domains/article';
import { ArticleGenerationMessage, ArticleGenerationStatusType } from '@/domains/article-realtime';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { getRSSCacheCollection } from '@/lib/mongodb';
import { supabase } from '@/lib/supabase';
import { HttpStatus } from '@/utils/api';
import {
  generateExecutionReport,
  generateMultipleArticle,
  getExistingArticles,
  saveArticlesToDB,
  sendExecutionReport,
} from '@/utils/generateArticle';
import sendEmail from '@/utils/sendEmail';
import { isAdminToken } from '@/utils/token';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(HttpStatus.MethodNotAllowed).json({
      message: `Method ${req.method} not allowed`,
    });
  }

  const { maxArticles = 1, selectedItems = [] } = req.body;

  try {
    const isAdmin = await isAdminToken(req.headers.authorization);
    if (!isAdmin) {
      return res.status(HttpStatus.Forbidden).json({
        message: 'Insufficient permissions',
      });
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(HttpStatus.Unauthorized).json({
      message: 'Invalid token',
    });
  }

  const jobId = uuidv4();

  console.info(`🎯 [${jobId}] New article generation request received`, {
    nodeEnv: process.env.NODE_ENV,
    timestamp: moment().toISOString(),
    maxArticles,
    selectedItemsCount: selectedItems.length,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasSupabaseConfig: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });

  res.status(HttpStatus.Ok).json({
    message: '文章生成已開始處理',
    jobId,
    status: 'processing',
  });

  console.info(`✅ [${jobId}] Response sent to client, starting background process`);

  processArticleGeneration(jobId, maxArticles, selectedItems).catch((error) => {
    console.info(`❌ [${jobId}] Background process catch block:`, error);
  });
};

const broadcastStatus = async (
  jobId: string,
  status: ArticleGenerationStatusType,
  message: string,
  data?: ArticleGenerationMessage['data']
) => {
  try {
    const channelName = `article_generation_${jobId}`;
    console.info(`📡 [${jobId}] Attempting broadcast: ${status} - ${message}`, {
      channelName,
      hasData: !!data,
      timestamp: moment().toISOString(),
    });

    console.info(`📡 [${jobId}] Supabase client status:`, {
      hasSupabase: !!supabase,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });

    const updateMessage: ArticleGenerationMessage = {
      type: 'article_generation_update',
      jobId,
      status,
      message,
      timestamp: moment().toISOString(),
      data,
    };

    const result = await supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'article_generation_update',
      payload: updateMessage,
    });

    console.info(`✅ [${jobId}] Broadcast completed: ${status}`, { result });
  } catch (error) {
    console.info(`❌ [${jobId}] Broadcast exception:`, error);
  }
};

const processArticleGeneration = async (jobId: string, maxArticles: number, selectedItems: string[]) => {
  const startTime = Date.now();

  try {
    console.info(`🚀 [${jobId}] Starting background article generation`, {
      nodeEnv: process.env.NODE_ENV,
      timestamp: moment().toISOString(),
      selectedItemsCount: selectedItems.length,
      maxArticles,
    });

    await broadcastStatus(jobId, ArticleGenerationStatusType.STARTING, '開始處理文章生成請求');

    console.info(`📖 [${jobId}] Reading cache data`);
    await broadcastStatus(jobId, ArticleGenerationStatusType.READING_CACHE, '正在讀取快取的RSS資料');

    const cacheCollection = await getRSSCacheCollection();
    let cachedItems;

    if (selectedItems.length > 0) {
      cachedItems = await cacheCollection.find({ sourceUrl: { $in: selectedItems } }).toArray();
      console.info(`📝 [${jobId}] Found ${cachedItems.length} selected cached items`);
    } else {
      cachedItems = await cacheCollection.find({}).limit(maxArticles).toArray();
      console.info(`📝 [${jobId}] Found ${cachedItems.length} cached items (auto-selected)`);
    }

    if (cachedItems.length === 0) {
      const errorMsg = selectedItems.length > 0 ? '找不到選中的RSS資料' : '找不到快取的RSS資料，請先執行RSS獲取';
      console.info(`❌ [${jobId}] No cached items found: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    await broadcastStatus(jobId, ArticleGenerationStatusType.READING_CACHE, `成功讀取 ${cachedItems.length} 篇快取資料`, {
      cachedCount: cachedItems.length,
      selectedCount: selectedItems.length,
    });

    const rssItems: RSSItem[] = cachedItems.map((item) => ({
      title: item.title,
      content: item.content,
      published_date: item.publishedDate,
      source_url: item.sourceUrl,
      category: item.category,
    }));

    console.info(`🔄 [${jobId}] Converted to RSSItem format`, {
      itemCount: rssItems.length,
      firstItemTitle: rssItems[0]?.title,
    });

    console.info(`📚 [${jobId}] Getting existing articles`);
    const existingArticles = await getExistingArticles();

    console.info(`🤖 [${jobId}] Starting article generation with OpenAI`);
    await broadcastStatus(jobId, ArticleGenerationStatusType.GENERATING, `正在基於 ${rssItems.length} 篇新聞生成文章`);

    const generatedArticle = await generateMultipleArticle(rssItems, existingArticles);
    console.info(`✅ [${jobId}] Article generated successfully`, {
      title: generatedArticle.title,
      contentLength: generatedArticle.content.length,
      tagsCount: generatedArticle.tags.length,
    });

    console.info(`💾 [${jobId}] Saving article to database`);
    await broadcastStatus(jobId, ArticleGenerationStatusType.SAVING, '正在儲存生成的文章');

    const savedArticles = await saveArticlesToDB([generatedArticle]);
    console.info(`✅ [${jobId}] Successfully saved ${savedArticles.length} articles`);

    console.info(`🗑️ [${jobId}] Clearing cache`);
    if (selectedItems.length > 0) {
      await cacheCollection.deleteMany({ sourceUrl: { $in: selectedItems } });
      console.info(`🗑️ [${jobId}] Cleared selected RSS cache items: ${selectedItems.length}`);
    } else {
      await cacheCollection.deleteMany({});
      console.info(`🗑️ [${jobId}] Cleared all RSS cache`);
    }

    const report = generateExecutionReport(rssItems, savedArticles, [generatedArticle]);

    sendExecutionReport(report).catch((error) => {
      console.info(`❌ [${jobId}] Failed to send execution report:`, error);
    });

    const executionTime = Date.now() - startTime;
    console.info(`✅ [${jobId}] Article generation completed in ${executionTime}ms`);

    const articleUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}${getPageUrlByType(PageType.ARTICLES)}/${savedArticles[0].customLink}`;
    await broadcastStatus(jobId, ArticleGenerationStatusType.COMPLETED, '文章生成完成！', {
      articleTitle: savedArticles[0].title,
      articleUrl,
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.info(`❌ [${jobId}] Background article generation failed after ${executionTime}ms`, {
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
    });

    try {
      const cacheCollection = await getRSSCacheCollection();
      if (selectedItems.length > 0) {
        await cacheCollection.deleteMany({ sourceUrl: { $in: selectedItems } });
      } else {
        await cacheCollection.deleteMany({});
      }
      console.info(`🗑️ [${jobId}] Cleared RSS cache due to error`);
    } catch (cleanupError) {
      console.info(`❌ [${jobId}] Cache cleanup failed:`, cleanupError);
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    await broadcastStatus(jobId, ArticleGenerationStatusType.ERROR, '文章生成失敗', { error: errorMessage });

    await sendErrorNotification(error, startTime);
  }
};

const sendErrorNotification = async (error: unknown, startTime: number) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const siteName = process.env.NEXT_PUBLIC_SITENAME || '';

  if (!adminEmail) return;

  const executionTime = Date.now() - startTime;
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';

  try {
    await sendEmail({
      to: adminEmail,
      subject: `❌ ${siteName} - 文章生成失敗通知`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">文章生成處理失敗</h2>
          <p><strong>錯誤時間：</strong> ${moment().toISOString()}</p>
          <p><strong>執行時間：</strong> ${executionTime}ms</p>
          <p><strong>錯誤訊息：</strong> ${errorMessage}</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <pre style="white-space: pre-wrap; font-size: 12px;">${errorStack}</pre>
          </div>
          <p>請檢查系統狀態並手動重試。</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.info('Failed to send error notification:', emailError);
  }
};

export default handler;
