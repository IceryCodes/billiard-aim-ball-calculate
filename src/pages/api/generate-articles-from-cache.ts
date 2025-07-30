import { Collection } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

import { ArticleDBProps, RSSItem } from '@/domains/article';
import { ArticleGenerationMessage, ArticleGenerationStatusType } from '@/domains/article-realtime';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { getArticlesCollection, getRSSCacheCollection } from '@/lib/mongodb';
import { supabase } from '@/lib/supabase';
import { HttpStatus } from '@/utils/api';
import sendEmail from '@/utils/sendEmail';
import { isAdminToken } from '@/utils/token';

// Global Variables
const OPENAI_MODEL = 'gpt-4o-mini';
const FIXED_AUTHOR_ID = '673868d5becfbcdd168ebeb0';
const EXCHANGE_RATE = 31.5;

interface ProcessedArticle {
  title: string;
  description: string;
  tags: string[];
  content: string;
  category: string;
  sourceUrl: string;
  sourceDate: Date;
}

interface ExecutionReport {
  execution_time: string;
  website_name: string;
  total_articles_processed: number;
  successful_imports: number;
  failed_imports: number;
  cost_analysis: {
    total_tokens_used: number;
    estimated_input_tokens: number;
    estimated_output_tokens: number;
    cost_usd: number;
    cost_twd: number;
    cost_breakdown: {
      input_cost_usd: number;
      output_cost_usd: number;
    };
  };
  api_usage: {
    openai_requests: number;
    mongodb_operations: number;
  };
  token_estimation_note: string;
  article_urls: { title: string; url: string }[];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

  // 生成 jobId 並立即回傳
  const jobId = uuidv4();

  console.info(`🎯 [${jobId}] New article generation request received`, {
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    maxArticles,
    selectedItemsCount: selectedItems.length,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasSupabaseConfig: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });

  // 立即回傳處理狀態，避免 Vercel 超時
  res.status(HttpStatus.Ok).json({
    message: '文章生成已開始處理',
    jobId,
    status: 'processing',
  });

  console.info(`✅ [${jobId}] Response sent to client, starting background process`);

  // 背景處理文章生成
  processArticleGeneration(jobId, maxArticles, selectedItems).catch((error) => {
    console.info(`❌ [${jobId}] Background process catch block:`, error);
  });
};

// WebSocket 推送函數
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
      timestamp: new Date().toISOString(),
    });

    // 檢查 Supabase 客戶端
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
      timestamp: new Date().toISOString(),
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

// 背景處理函數
const processArticleGeneration = async (jobId: string, maxArticles: number, selectedItems: string[]) => {
  const startTime = Date.now();

  try {
    console.info(`🚀 [${jobId}] Starting background article generation`, {
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      selectedItemsCount: selectedItems.length,
      maxArticles,
    });

    await broadcastStatus(jobId, ArticleGenerationStatusType.STARTING, '開始處理文章生成請求');

    // 1. 從快取讀取資料
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

    // 2. 轉換格式為RSSItem數組
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

    // 3. 獲取現有文章
    console.info(`📚 [${jobId}] Getting existing articles`);
    const existingArticles = await getExistingArticles();

    // 4. 生成文章
    console.info(`🤖 [${jobId}] Starting article generation with OpenAI`);
    await broadcastStatus(jobId, ArticleGenerationStatusType.GENERATING, `正在基於 ${rssItems.length} 篇新聞生成文章`);

    const generatedArticle = await generateArticle(rssItems, existingArticles);
    console.info(`✅ [${jobId}] Article generated successfully`, {
      title: generatedArticle.title,
      contentLength: generatedArticle.content.length,
      tagsCount: generatedArticle.tags.length,
    });

    // 5. 儲存文章
    console.info(`💾 [${jobId}] Saving article to database`);
    await broadcastStatus(jobId, ArticleGenerationStatusType.SAVING, '正在儲存生成的文章');

    const savedArticles = await saveArticlesToDB([generatedArticle]);
    console.info(`✅ [${jobId}] Successfully saved ${savedArticles.length} articles`);

    // 6. 清除快取（只清除已使用的）
    console.info(`🗑️ [${jobId}] Clearing cache`);
    if (selectedItems.length > 0) {
      await cacheCollection.deleteMany({ sourceUrl: { $in: selectedItems } });
      console.info(`🗑️ [${jobId}] Cleared selected RSS cache items: ${selectedItems.length}`);
    } else {
      await cacheCollection.deleteMany({});
      console.info(`🗑️ [${jobId}] Cleared all RSS cache`);
    }

    // 7. 生成報告
    const report = generateExecutionReport(rssItems, savedArticles, [generatedArticle]);

    // 8. 異步發送報告
    sendExecutionReport(report).catch((error) => {
      console.info(`❌ [${jobId}] Failed to send execution report:`, error);
    });

    const executionTime = Date.now() - startTime;
    console.info(`✅ [${jobId}] Article generation completed in ${executionTime}ms`);

    // 推送完成狀態
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

    // 清除快取
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

    // 推送錯誤狀態
    const errorMessage = error instanceof Error ? error.message : String(error);
    await broadcastStatus(jobId, ArticleGenerationStatusType.ERROR, '文章生成失敗', { error: errorMessage });

    // 發送錯誤報告
    await sendErrorNotification(error, startTime);
  }
};

// 錯誤通知函數
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
          <p><strong>錯誤時間：</strong> ${new Date().toISOString()}</p>
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

const getExistingArticles = async (): Promise<string> => {
  const articlesCollection: Collection<Omit<ArticleDBProps, '_id'>> = await getArticlesCollection();
  const articles = await articlesCollection.find({}).sort({ createdAt: -1 }).limit(20).toArray();

  if (articles.length === 0) {
    return '- 暫無相關文章';
  }

  return articles.map((article) => `${article.title}: /${article.customLink}`).join('\n');
};

// 更新generateArticle函數，支援多篇新聞
const generateArticle = async (newsItems: RSSItem[], existingArticles: string): Promise<ProcessedArticle> => {
  const siteName = process.env.NEXT_PUBLIC_SITENAME || '';

  // 構建新聞內容字符串
  const newsContent = newsItems
    .map(
      (item, index) => `
**新聞 ${index + 1}：**
標題：${item.title}
內容：${item.content}
分類：${item.category}
發布日期：${item.published_date}
來源網址：${item.source_url}
`
    )
    .join('\n');

  // 構建來源連結列表
  const sourceLinks = newsItems
    .map(
      (item, index) => `
- 新聞來源 ${index + 1}：[${item.title}](${item.source_url})`
    )
    .join('\n');

  const prompt = `
你是${siteName}的專業撞球文案編輯。

基於以下${newsItems.length}篇新聞內容，請創建一篇與撞球相關的專業文章。如果有多篇新聞，請將它們的內容融合整合成一篇連貫的文章，不要用太論文的口吻來敘述，而是用專業但輕鬆的方式來說明，最好有點像一般網路文章或官網的小知識分享的感覺：

${newsContent}

**可用的外部連結清單（請從中選擇相關的網站，這些都是經過驗證的真實網站）：**
- Icery.tw：https://www.Icery.tw
- Icery Official影片工作室：https://www.IceryOfficial.com
- 中華民國撞球協會：http://www.cuesports.org.tw
- Matchroom Pool撞球賽事組織：https://matchroompool.com
- AZ Billiards撞球資訊網：https://www.azbilliards.com
- Billiards Digest撞球雜誌：https://www.billiardsdigest.com
- 世界撞球協會WPA Pool：https://wpapool.com
- 美國撞球協會APA：https://poolplayers.com
- 世界撞球組織World Billiards：https://world-billiards.com
- 專業撞球系列賽Pro Billiard Series：https://probilliardseries.com
- AZ Billiards論壇：https://forums.azbilliards.com
- 撞球論壇Billiards Forum：http://www.billiardsforum.com

請產生以下JSON格式的內容：
{
  "title": "文章標題（15-25字，包含撞球關鍵字）",
  "description": "文章描述（80-130字的摘要）",
  "tags": ["5個與撞球相關的中文標籤"],
  "content": "完整文章內容（1000-2000字，必須使用Markdown格式）",
  "category": "撞球趣聞"
}

文章內容要求：
1. 使用 # 和 ## 標籤作為標題
2. **文章描述**（80-130字的摘要）
3. **關鍵字標籤**（5個與撞球相關的中文標籤）
4. **完整文章內容**（1000-2000字，**必須使用Markdown格式**）
  - 使用 ## 和 ### 標籤作為副標題，最多可以用到 ####
  - 使用條列式清單
  - 必須包含至少一個條列式清單
  - **需要至少3個跟內文相關的外部連結，必須從上方提供的清單中選擇**
  - **必須包含所有原始新聞的連結：${sourceLinks}**
  - **其他外部連結請從上方清單中選擇最相關的網站，格式：[具體且有意義的連結文字](網址)**
  - **嚴禁使用清單以外的網址，不可自行編造網址**
  - **連結文字必須具體說明連結內容**
  - **需要至少2個${siteName}現有的文章內部連結，除非沒有現有文章可以參考**
  - **如果連結到首頁，請使用：[${siteName}](/)**
  - **不要使用模糊的連結文字如"我們的網站"、"點擊這裡"、"這裡"、"點我"、"查看"、"這篇文章"、"這個網站"**
  - 內容要與原新聞結合撞球專業觀點
  - 如果有多篇新聞，請將內容融合整合，找出共同主題或關聯性
  - 使用SEO友善的寫作方式，盡量在文中多包涵相關關鍵字
  - 語調專業但易懂
  - 不需要包含完整標題在內文中
  - 內文不需包含引言或簡要等段落
  - 標題必須出現"撞球"兩個字
  - 內容主題不可與現有文章相似，必須是不同主題
  - 最後必須包含"總結"段落
  - 內文不可以出現單引號或雙引號，請用粗體表示強調

  **現有文章列表**：${existingArticles}
  - **內部連結格式：[具體文章標題或功能名稱](相對路徑)**
  - 請根據文章url來設置正確且確實有存在的內部連結
  - 請選擇與當前文章主題相關的現有文章進行連結，如果找不到相關文章，可以連結到主要頁面

5. **文章分類**：統一歸類到「撞球趣聞」

請確保內容原創且具有實用價值，所有外部連結都必須從提供的清單中選擇，所有人名、場地、比賽名稱不用特地轉成繁體中文，可以用該名稱原語言真實名稱，但其餘部分需保持繁體中文。

**重要：請只回傳純 JSON 格式，不要包含任何 markdown 標記、註解或其他文字。直接回傳 JSON 物件即可。**
`;

  console.info(`🤖 About to call OpenAI API`, {
    model: OPENAI_MODEL,
    promptLength: prompt.length,
    hasApiKey: !!process.env.OPENAI_API_KEY,
    apiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 12) + '...',
    newsItemsCount: newsItems.length,
  });

  let response;
  try {
    response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            '你是一位專業的撞球文案編輯，擅長將時事新聞轉換為撞球相關的實用內容。請只回傳純 JSON 格式，不要使用 markdown 或其他格式包裝。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    console.info(`✅ OpenAI API response received`, {
      usage: response.usage,
      responseLength: response.choices[0]?.message?.content?.length || 0,
      finishReason: response.choices[0]?.finish_reason,
    });
  } catch (openaiError) {
    console.info(`❌ OpenAI API call failed`, {
      errorName: openaiError instanceof Error ? openaiError.name : 'Unknown',
      errorMessage: openaiError instanceof Error ? openaiError.message : String(openaiError),
    });
    throw new Error(`OpenAI API 調用失敗: ${openaiError instanceof Error ? openaiError.message : String(openaiError)}`);
  }

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.info(`❌ OpenAI response is empty`, { response: response.choices[0] });
    throw new Error('OpenAI response is empty');
  }

  console.info(`📝 Processing OpenAI response`, {
    rawLength: content.length,
    startsWithJson: content.trim().startsWith('{'),
    endsWithJson: content.trim().endsWith('}'),
  });

  const cleanContent = content
    .replace(/^```json\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  let parsed: ProcessedArticle;
  try {
    parsed = JSON.parse(cleanContent) as ProcessedArticle;
    console.info(`✅ JSON parsed successfully`, {
      hasTitle: !!parsed.title,
      hasDescription: !!parsed.description,
      hasContent: !!parsed.content,
      hasTags: !!parsed.tags,
      tagsCount: parsed.tags?.length || 0,
    });
  } catch (parseError) {
    console.info(`❌ Failed to parse OpenAI response as JSON`, {
      parseError: parseError instanceof Error ? parseError.message : String(parseError),
      contentPreview: cleanContent.substring(0, 200),
      contentLength: cleanContent.length,
    });
    throw new Error(
      `Failed to parse OpenAI JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
    );
  }

  if (!parsed.title || !parsed.description || !parsed.content || !parsed.tags || parsed.tags.length === 0) {
    console.info(`❌ Generated article missing required fields`, {
      hasTitle: !!parsed.title,
      hasDescription: !!parsed.description,
      hasContent: !!parsed.content,
      hasTags: !!parsed.tags,
      tagsLength: parsed.tags?.length || 0,
    });
    throw new Error('Generated article missing required fields');
  }

  console.info(`✅ Article validation passed`, {
    title: parsed.title.substring(0, 50),
    descriptionLength: parsed.description.length,
    contentLength: parsed.content.length,
    tagsCount: parsed.tags.length,
  });

  return {
    ...parsed,
    sourceUrl: newsItems.map((item) => item.source_url).join(', '), // 多個來源用逗號分隔
    sourceDate: new Date(Math.max(...newsItems.map((item) => new Date(item.published_date).getTime()))), // 使用最新的日期
  };
};

// 其餘函數保持不變...
const saveArticlesToDB = async (articles: ProcessedArticle[]): Promise<ArticleDBProps[]> => {
  const articlesCollection: Collection<Omit<ArticleDBProps, '_id'>> = await getArticlesCollection();
  const savedArticles: ArticleDBProps[] = [];

  for (const article of articles) {
    const customLink = article.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').trim();

    if (!customLink) {
      throw new Error(`Failed to generate customLink for article: ${article.title}`);
    }

    const newArticle: Omit<ArticleDBProps, '_id'> = {
      title: article.title,
      author: FIXED_AUTHOR_ID,
      excerpt: article.description,
      content: article.content,
      featuredImg: '',
      customLink,
      tags: article.tags,
      sourceUrl: article.sourceUrl,
      sourceDate: article.sourceDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await articlesCollection.insertOne(newArticle);

    if (!result.insertedId) {
      throw new Error(`Failed to save article to database: ${article.title}`);
    }

    savedArticles.push({
      ...newArticle,
      _id: result.insertedId,
    });
  }

  return savedArticles;
};

const generateExecutionReport = (
  processedItems: RSSItem[],
  savedArticles: ArticleDBProps[],
  generatedArticles: ProcessedArticle[]
): ExecutionReport => {
  const totalTokens = generatedArticles.reduce((sum, article) => {
    return sum + (article.title + article.description + article.content).length / 4;
  }, 0);

  const estimatedInputTokens = totalTokens * 0.65;
  const estimatedOutputTokens = totalTokens * 0.35;

  const INPUT_COST_PER_1K_TOKENS = 0.00015;
  const OUTPUT_COST_PER_1K_TOKENS = 0.0006;

  const inputCostUSD = (estimatedInputTokens / 1000) * INPUT_COST_PER_1K_TOKENS;
  const outputCostUSD = (estimatedOutputTokens / 1000) * OUTPUT_COST_PER_1K_TOKENS;
  const totalCostUSD = inputCostUSD + outputCostUSD;
  const totalCostTWD = totalCostUSD * EXCHANGE_RATE;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const siteName = process.env.NEXT_PUBLIC_SITENAME || '';

  return {
    execution_time: new Date().toISOString(),
    website_name: siteName,
    total_articles_processed: processedItems.length,
    successful_imports: savedArticles.length,
    failed_imports: processedItems.length - savedArticles.length,
    cost_analysis: {
      total_tokens_used: Math.round(totalTokens),
      estimated_input_tokens: Math.round(estimatedInputTokens),
      estimated_output_tokens: Math.round(estimatedOutputTokens),
      cost_usd: Math.round(totalCostUSD * 10000) / 10000,
      cost_twd: Math.round(totalCostTWD * 100) / 100,
      cost_breakdown: {
        input_cost_usd: Math.round(inputCostUSD * 10000) / 10000,
        output_cost_usd: Math.round(outputCostUSD * 10000) / 10000,
      },
    },
    api_usage: {
      openai_requests: generatedArticles.length,
      mongodb_operations: savedArticles.length * 2,
    },
    token_estimation_note: 'Token計數是根據字元數÷4估算的，實際使用情況可能會有所不同',
    article_urls: savedArticles.map((article) => ({
      title: article.title,
      url: `${baseUrl}${getPageUrlByType(PageType.ARTICLES)}/${article.customLink}`,
    })),
  };
};

const sendExecutionReport = async (report: ExecutionReport): Promise<void> => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const siteName = process.env.NEXT_PUBLIC_SITENAME || '';

  if (!adminEmail) {
    throw new Error('Email configuration is missing');
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764b8e 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .section { margin-bottom: 25px; }
        .section-title { color: #667eea; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 5px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: #f8f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; }
        .stat-number { font-size: 24px; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; font-size: 14px; }
        .success { color: #27ae60; font-weight: bold; }
        .failed { color: #e74c3c; font-weight: bold; }
        .cost-breakdown { background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-info { background: #d1ecf1; color: #0c5460; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐾 ${siteName} - 自動文章生成報告</h1>
            <p>執行時間：${report.execution_time}</p>
        </div>

        <div class="section">
            <div class="section-title">📊 執行摘要</div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${report.total_articles_processed}</div>
                    <div class="stat-label">處理文章總數</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number success">${report.successful_imports}</div>
                    <div class="stat-label">成功匯入</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number failed">${report.failed_imports}</div>
                    <div class="stat-label">匯入失敗</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${report.cost_analysis.total_tokens_used}</div>
                    <div class="stat-label">使用 Token 數</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">💰 成本分析</div>
            <div class="cost-breakdown">
                <p><strong>總成本：</strong> 
                   <span class="badge badge-info">$${report.cost_analysis.cost_usd}</span> 
                   <span class="badge badge-success">NT$${report.cost_analysis.cost_twd}</span>
                </p>
                <p><strong>Token 使用詳情：</strong></p>
                <ul>
                    <li>輸入 Token：${report.cost_analysis.estimated_input_tokens} ($${report.cost_analysis.cost_breakdown.input_cost_usd})</li>
                    <li>輸出 Token：${report.cost_analysis.estimated_output_tokens} ($${report.cost_analysis.cost_breakdown.output_cost_usd})</li>
                </ul>
                <p><em>${report.token_estimation_note}</em></p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">文章連結</div>
            <div class="cost-breakdown">
                <ul>${report.article_urls.map(({ title, url }) => `<li><a href="${url}" target="_blank">${title}</a></li>`).join('')}</ul>
            </div>
        </div>

        <div class="section">
            <div class="section-title">🔧 API 使用統計</div>
            <ul>
                <li><strong>OpenAI 請求：</strong> ${report.api_usage.openai_requests} 次</li>
                <li><strong>MongoDB 操作：</strong> ${report.api_usage.mongodb_operations} 次</li>
            </ul>
        </div>

        <div class="footer">
            <p>此郵件由${siteName}自動化系統生成</p>
        </div>
    </div>
</body>
</html>`;

  await sendEmail({
    to: adminEmail,
    subject: `${siteName} - 自動文章生成報告 (${report.execution_time})`,
    html: htmlContent,
  });
};

export default handler;
