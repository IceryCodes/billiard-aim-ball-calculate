export enum ArticleGenerationStatusType {
  STARTING = 'starting',
  READING_CACHE = 'reading_cache',
  GENERATING = 'generating',
  SAVING = 'saving',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export interface ArticleGenerationMessage {
  type: 'article_generation_update';
  jobId: string;
  status: ArticleGenerationStatusType;
  message: string;
  timestamp: string;
  data?: {
    cachedCount?: number;
    selectedCount?: number;
    articleTitle?: string;
    articleUrl?: string;
    error?: string;
  };
}

export interface ArticleGenerationPresenceData {
  userId: string;
  jobId: string;
  startTime: string;
}
