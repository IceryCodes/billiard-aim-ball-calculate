import moment from 'moment';
import { Collection } from 'mongodb';
import OpenAI from 'openai';

import { ArticleDBProps, RSSItem } from '@/domains/article';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { getArticlesCollection } from '@/lib/mongodb';
import sendEmail from '@/utils/sendEmail';

export const OPENAI_MODEL = 'gpt-4o-mini';
export const FIXED_AUTHOR_ID = '673868d5becfbcdd168ebeb0';
export const EXCHANGE_RATE = 31.5;
export const EXCLUDED_KEYWORDS = [
  '娛樂',
  '藝人',
  '明星',
  '八卦',
  '性愛',
  '色情',
  '賭博',
  '暴力',
  '血腥',
  '犯罪',
  '死亡',
  '車禍',
  '政治',
  '選舉',
  '抗議',
  '示威',
];

export interface ProcessedArticle {
  title: string;
  description: string;
  tags: string[];
  content: string;
  category: string;
  sourceUrl: string;
  sourceDate: Date;
}

export interface ExecutionReport {
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

export const getExistingArticles = async (): Promise<string> => {
  const articlesCollection: Collection<Omit<ArticleDBProps, '_id'>> = await getArticlesCollection();
  const articles = await articlesCollection.find({}).sort({ createdAt: -1 }).limit(20).toArray();

  if (articles.length === 0) {
    return '- 暫無相關文章';
  }

  return articles.map((article) => `${article.title}: /${article.customLink}`).join('\n');
};

export const generateSingleArticle = async (newsItem: RSSItem, existingArticles: string): Promise<ProcessedArticle> => {
  const siteName = process.env.NEXT_PUBLIC_SITENAME || '';

  const prompt = `
你是${siteName}的專業撞球文案編輯。

基於以下新聞內容，請創建一篇與撞球相關的專業文章，不要用太論文的口吻來敘述，而是用專業但輕鬆的方式來說明，最好有點像一般網路文章或官網的小知識分享的感覺：

原始新聞標題：${newsItem.title}
新聞內容：${newsItem.content}
新聞分類：${newsItem.category}
發布日期：${newsItem.published_date}
新聞來源網址：${newsItem.source_url}

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
  - **其中必須包含一個原始新聞的連結：${newsItem.title}(${newsItem.source_url})**
  - **其他外部連結請從上方清單中選擇最相關的網站，格式：[具體且有意義的連結文字](${newsItem.source_url})**
  - **嚴禁使用清單以外的網址，不可自行編造網址**
  - **連結文字必須具體說明連結內容**
  - **需要至少2個${siteName}現有的文章內部連結，除非沒有現有文章可以參考**
  - **如果連結到首頁，請使用：[${siteName}](/)**
  - **不要使用模糊的連結文字如"我們的網站"、"點擊這裡"、"這裡"、"點我"、"查看"、"這篇文章"、"這個網站"**
  - 內容要與原新聞結合撞球專業觀點
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

  const response = await openai.chat.completions.create({
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

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI response is empty');
  }

  const cleanContent = content
    .replace(/^```json\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  let parsed: ProcessedArticle;
  try {
    parsed = JSON.parse(cleanContent) as ProcessedArticle;
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', content);
    throw new Error(`Failed to parse OpenAI JSON response: ${parseError}`);
  }

  if (!parsed.title || !parsed.description || !parsed.content || !parsed.tags || parsed.tags.length === 0) {
    throw new Error('Generated article missing required fields');
  }

  return {
    ...parsed,
    sourceUrl: newsItem.source_url,
    sourceDate: moment(newsItem.published_date).toDate(),
  };
};

export const generateMultipleArticle = async (newsItems: RSSItem[], existingArticles: string): Promise<ProcessedArticle> => {
  const siteName = process.env.NEXT_PUBLIC_SITENAME || '';

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

  const response = await openai.chat.completions.create({
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

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI response is empty');
  }

  const cleanContent = content
    .replace(/^```json\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  let parsed: ProcessedArticle;
  try {
    parsed = JSON.parse(cleanContent) as ProcessedArticle;
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', content);
    throw new Error(`Failed to parse OpenAI JSON response: ${parseError}`);
  }

  if (!parsed.title || !parsed.description || !parsed.content || !parsed.tags || parsed.tags.length === 0) {
    throw new Error('Generated article missing required fields');
  }

  return {
    ...parsed,
    sourceUrl: newsItems.map((item) => item.source_url).join(', '),
    sourceDate: moment(Math.max(...newsItems.map((item) => moment(item.published_date).valueOf()))).toDate(),
  };
};

export const saveArticlesToDB = async (articles: ProcessedArticle[]): Promise<ArticleDBProps[]> => {
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

export const generateExecutionReport = (
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
    execution_time: moment().toISOString(),
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

export const sendExecutionReport = async (report: ExecutionReport): Promise<void> => {
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
            <h1>🐾 ${report.website_name} - 自動文章生成報告</h1>
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
            <p>此郵件由${report.website_name}自動化系統生成</p>
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

export const filterNewsContent = (items: RSSItem[]): RSSItem[] => {
  console.error(`Starting filter with ${items.length} items`);

  const filteredItems = items.filter((item) => {
    const fullText = `${item.title} ${item.content}`;
    const hasExcludedKeyword = EXCLUDED_KEYWORDS.some((keyword) => fullText.includes(keyword));

    if (hasExcludedKeyword) {
      console.error(`Item filtered out by keyword: ${item.title}`);
      return false;
    }

    return true;
  });

  console.error(`After filtering: ${filteredItems.length} items remaining`);
  return filteredItems;
};
