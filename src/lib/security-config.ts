export const SECURITY_LIMITS = {
  // 文件上傳限制（支持更多手機格式）
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE_MB || '3') * 1024 * 1024,
  MAX_FILES_PER_SESSION: parseInt(process.env.MAX_FILES_PER_SESSION || '5'),
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif', // iPhone 格式
    'image/avif', // 新格式
  ],

  // 全局限制
  MAX_CONCURRENT_SESSIONS: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '100'),
  MAX_DAILY_SESSIONS_PER_IP: parseInt(process.env.MAX_DAILY_SESSIONS_PER_IP || '50'),

  // 內容限制
  MAX_OCR_TEXT_LENGTH: parseInt(process.env.MAX_OCR_TEXT_LENGTH || '10000'),
  MAX_TEXT_INPUT_LENGTH: parseInt(process.env.MAX_TEXT_INPUT_LENGTH || '5000'),

  // OCR 超時設置
  OCR_TIMEOUT_MS: parseInt(process.env.OCR_TIMEOUT_SECONDS || '30') * 1000,

  // Rate limiting
  QR_GENERATION_LIMIT: parseInt(process.env.QR_GENERATION_LIMIT_PER_MINUTE || '5'),
  UPLOAD_LIMIT: parseInt(process.env.UPLOAD_LIMIT_PER_MINUTE || '10'),
};
