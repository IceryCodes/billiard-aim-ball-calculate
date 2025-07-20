import fs from 'fs';
import os from 'os';
import path from 'path';

import formidable from 'formidable';
import { NextApiRequest, NextApiResponse } from 'next';
import Tesseract from 'tesseract.js';

import { SECURITY_LIMITS } from '@/lib/security-config';
import { cleanup, deleteSession, getSession, incrementFileCount, markSessionAsUsed } from '@/lib/sessions';

interface FileValidationResult {
  isValid: boolean;
  error?: string;
  actualType?: string;
}

interface OCRResult {
  text: string;
  confidence: number;
}

interface UploadResponse {
  success: boolean;
  text?: string;
  confidence?: number;
  error?: string;
}

// 修復：手機格式友好的文件類型檢測
const detectFileType = async (filePath: string): Promise<string | null> => {
  try {
    const buffer = Buffer.alloc(16); // 增加到 16 bytes 以支持更多格式
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    const hex = buffer.toString('hex').toUpperCase();

    // JPEG: FF D8 FF
    if (hex.startsWith('FFD8FF')) return 'image/jpeg';

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (hex.startsWith('89504E470D0A1A0A')) return 'image/png';

    // GIF: 47 49 46 38
    if (hex.startsWith('474946383761') || hex.startsWith('474946383961')) return 'image/gif';

    // WebP: 52 49 46 46 xx xx xx xx 57 45 42 50
    // 修復：使用 substring 替代 deprecated 的 substr
    if (hex.startsWith('52494646') && hex.substring(16, 24) === '57454250') return 'image/webp';

    // HEIC: 00 00 00 xx 66 74 79 70 68 65 69 63 (ftyp heic)
    if (hex.includes('667479706865696')) return 'image/heic';

    // HEIF: similar to HEIC but with different brand
    if (hex.includes('6674797068656966')) return 'image/heif';

    // AVIF: 00 00 00 xx 66 74 79 70 61 76 69 66
    if (hex.includes('66747970617669')) return 'image/avif';

    return null;
  } catch {
    return null;
  }
};

// 增強的文件內容掃描
const scanFileContent = async (filePath: string): Promise<boolean> => {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > SECURITY_LIMITS.MAX_FILE_SIZE) return false;

    const buffer = Buffer.alloc(Math.min(2048, stats.size)); // 增加掃描範圍
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);

    const content = buffer.toString('binary');
    const suspiciousPatterns = [
      '<script',
      'javascript:',
      'data:text/html',
      '<?php',
      '#!/bin/',
      'MZ',
      'PK', // ZIP/executable headers
      '\x7fELF', // Linux executable
    ];

    return !suspiciousPatterns.some((pattern) => content.toLowerCase().includes(pattern.toLowerCase()));
  } catch {
    return false;
  }
};

// 文件驗證函數
const validateFile = async (filePath: string): Promise<FileValidationResult> => {
  try {
    if (!fs.existsSync(filePath)) {
      return { isValid: false, error: '文件不存在' };
    }

    const stats = fs.statSync(filePath);
    if (stats.size > SECURITY_LIMITS.MAX_FILE_SIZE) {
      return { isValid: false, error: `文件過大，最大允許 ${Math.round(SECURITY_LIMITS.MAX_FILE_SIZE / 1024 / 1024)}MB` };
    }
    if (stats.size === 0) {
      return { isValid: false, error: '文件為空' };
    }

    const actualType = await detectFileType(filePath);
    if (!actualType) {
      return { isValid: false, error: '無法識別的文件格式' };
    }

    if (!SECURITY_LIMITS.ALLOWED_FILE_TYPES.includes(actualType)) {
      return { isValid: false, error: '不支持的文件格式', actualType };
    }

    const isContentSafe = await scanFileContent(filePath);
    if (!isContentSafe) {
      return { isValid: false, error: '文件內容不安全' };
    }

    return { isValid: true, actualType };
  } catch (error) {
    console.error('File validation error:', error);
    return { isValid: false, error: '文件驗證失敗' };
  }
};

// 修復：帶超時的 OCR 處理 - 移除不必要的 async
const performOCRWithTimeout = (filePath: string): Promise<OCRResult> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('OCR 處理超時'));
    }, SECURITY_LIMITS.OCR_TIMEOUT_MS);

    const processOCR = async () => {
      try {
        console.info(`開始 OCR 處理: ${filePath}`);
        const startTime = Date.now();

        const worker = await Tesseract.createWorker('chi_tra+eng', 1, {
          cachePath: path.join(os.tmpdir(), 'tesseract-cache'),
          // 修復：提供有效的 logger 函數
          logger: (m) => {
            if (process.env.NODE_ENV === 'development') {
              console.info('Tesseract:', m);
            }
          },
        });

        // 優化設置以提高處理速度
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
          tessedit_char_whitelist: '', // 可以根據需要限制字符集
          preserve_interword_spaces: '1',
        });

        const result = await worker.recognize(filePath);
        await worker.terminate();

        clearTimeout(timeout);

        const processingTime = Date.now() - startTime;
        console.info(`OCR 處理完成，耗時: ${processingTime}ms`);

        const text = result.data.text.trim();
        const finalText =
          text.length > SECURITY_LIMITS.MAX_OCR_TEXT_LENGTH
            ? text.substring(0, SECURITY_LIMITS.MAX_OCR_TEXT_LENGTH) + '...(內容過長，已截斷)'
            : text;

        resolve({
          text: finalText,
          confidence: result.data.confidence,
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    };

    processOCR();
  });
};

// 表單解析，支持手機上傳
const parseForm = (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((resolve, reject) => {
    const uploadDir = os.tmpdir();

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: SECURITY_LIMITS.MAX_FILE_SIZE,
      maxFiles: 1,
      // 放寬過濾條件以支持手機格式
      filter: ({ mimetype, originalFilename }) => {
        if (!mimetype || !originalFilename) return false;

        // 允許所有 image/* 類型（瀏覽器會自動轉換很多格式）
        const isImage = mimetype.startsWith('image/');
        const hasValidExtension = /\.(jpg|jpeg|png|gif|webp|heic|heif|avif)$/i.test(originalFilename);

        return isImage || hasValidExtension; // 更寬鬆的條件
      },
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
};

const cleanupFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('清理文件失敗:', filePath, error);
  }
};

export const config = { api: { bodyParser: false } };

const handler = async (req: NextApiRequest, res: NextApiResponse<UploadResponse>) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // 每次請求都清理過期 session（Vercel 優化）
  cleanup();

  const startTime = Date.now();
  const clientIP = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

  try {
    const { fields, files } = await parseForm(req);

    const sessionId = Array.isArray(fields.sessionId) ? fields.sessionId[0] : fields.sessionId;
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
    const directText = Array.isArray(fields.directText) ? fields.directText[0] : fields.directText;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ success: false, error: '缺少 Session ID' });
    }

    const session = getSession(sessionId);

    if (!session) {
      if (imageFile?.filepath) cleanupFile(imageFile.filepath);
      return res.status(404).json({ success: false, error: 'Session 不存在，請重新產生並掃描QR Code!' });
    }

    if (Date.now() > session.expiresAt) {
      deleteSession(sessionId);
      if (imageFile?.filepath) cleanupFile(imageFile.filepath);
      return res.status(410).json({ success: false, error: 'Session 已過期，請重新產生並掃描QR Code!' });
    }

    // 檢查是否已被使用
    if (session.used) {
      if (imageFile?.filepath) cleanupFile(imageFile.filepath);
      return res.status(400).json({ success: false, error: 'Session 已被使用過' });
    }

    let result: OCRResult;

    // 處理直接文字輸入
    if (directText && typeof directText === 'string') {
      if (directText.length > SECURITY_LIMITS.MAX_TEXT_INPUT_LENGTH) {
        return res.status(400).json({
          success: false,
          error: `文字內容過長，最多允許 ${SECURITY_LIMITS.MAX_TEXT_INPUT_LENGTH} 個字符`,
        });
      }

      // XSS 防護
      const sanitizedText = directText
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');

      result = { text: sanitizedText.trim(), confidence: 100 };
    }
    // 處理圖片 OCR
    else if (imageFile?.filepath) {
      try {
        // 增加文件計數
        incrementFileCount(sessionId);

        // 檢查文件數量限制
        if (session.fileCount > SECURITY_LIMITS.MAX_FILES_PER_SESSION) {
          cleanupFile(imageFile.filepath);
          return res.status(400).json({
            success: false,
            error: `每個 session 最多允許 ${SECURITY_LIMITS.MAX_FILES_PER_SESSION} 個文件`,
          });
        }

        console.info(`開始處理文件: ${imageFile.originalFilename}, 大小: ${imageFile.size} bytes`);

        const validation = await validateFile(imageFile.filepath);
        if (!validation.isValid) {
          cleanupFile(imageFile.filepath);
          return res.status(400).json({ success: false, error: validation.error || '文件驗證失敗' });
        }

        console.info(`文件驗證通過，檢測到格式: ${validation.actualType}`);

        // 執行帶超時的 OCR
        result = await performOCRWithTimeout(imageFile.filepath);

        console.info(`OCR 完成，耗時: ${Date.now() - startTime}ms, 置信度: ${result.confidence}%`);
      } catch (error) {
        console.error('OCR error:', error);
        cleanupFile(imageFile.filepath);

        if (error instanceof Error && error.message === 'OCR 處理超時') {
          return res.status(408).json({
            success: false,
            error: `OCR 處理超時（超過 ${SECURITY_LIMITS.OCR_TIMEOUT_MS / 1000} 秒），請嘗試使用較小或較簡單的圖片`,
          });
        }

        return res.status(500).json({ success: false, error: 'OCR 處理失敗' });
      } finally {
        cleanupFile(imageFile.filepath);
      }
    } else {
      return res.status(400).json({ success: false, error: '缺少圖片文件或文字內容' });
    }

    // 標記 session 為已使用並更新結果
    markSessionAsUsed(sessionId);
    session.result = result;

    console.info(
      `請求處理成功: sessionId=${sessionId}, IP=${clientIP}, textLength=${result.text.length}, confidence=${result.confidence}%`
    );

    return res.status(200).json({
      success: true,
      text: result.text,
      confidence: result.confidence,
    });
  } catch (error) {
    console.error('Upload handler error:', error);

    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime,
      clientIP,
    };
    console.error('Error details:', errorDetails);

    return res.status(500).json({ success: false, error: '處理失敗' });
  }
};

export default handler;
