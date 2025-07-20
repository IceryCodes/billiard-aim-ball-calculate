// ===================================================================
// 📁 pages/api/upload-ocr.ts - 修復文件內容掃描邏輯
// ===================================================================

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
    const buffer = Buffer.alloc(16);
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

// 🔧 修復：智能文件內容掃描（針對圖片文件優化）
const scanFileContent = async (filePath: string, fileType: string): Promise<boolean> => {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > SECURITY_LIMITS.MAX_FILE_SIZE) return false;

    // 🎯 如果是圖片文件，使用更寬鬆的檢查
    if (fileType && fileType.startsWith('image/')) {
      console.info(`🖼️ Image file detected (${fileType}), using relaxed content scan`);

      // 對圖片文件，只檢查文件開頭是否有明顯的腳本標籤
      const buffer = Buffer.alloc(Math.min(512, stats.size)); // 只檢查前512字節
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, buffer.length, 0);
      fs.closeSync(fd);

      const content = buffer.toString('utf8', 0, Math.min(256, buffer.length)); // 只轉換前256字節為文本

      // 只檢查明顯的腳本注入攻擊
      const criticalPatterns = ['<script', '<iframe', 'javascript:', 'data:text/html', '<?php'];

      const foundPattern = criticalPatterns.find((pattern) => content.toLowerCase().includes(pattern.toLowerCase()));

      if (foundPattern) {
        console.info(`⚠️ Found suspicious pattern in image: ${foundPattern}`);
        return false;
      }

      console.info(`✅ Image content scan passed`);
      return true;
    }

    // 🔒 非圖片文件使用嚴格檢查
    console.info(`📄 Non-image file detected, using strict content scan`);

    const buffer = Buffer.alloc(Math.min(2048, stats.size));
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
      'MZ', // PE executable header
      'PK', // ZIP/executable headers
      '\x7fELF', // Linux executable
    ];

    const foundPattern = suspiciousPatterns.find((pattern) => content.toLowerCase().includes(pattern.toLowerCase()));

    if (foundPattern) {
      console.info(`❌ Found suspicious pattern: ${foundPattern}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Content scan error:', error);
    return false;
  }
};

// 🔧 修復：文件驗證函數
const validateFile = async (filePath: string): Promise<FileValidationResult> => {
  try {
    console.info(`🔍 Starting file validation for: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.info(`❌ File does not exist: ${filePath}`);
      return { isValid: false, error: '文件不存在' };
    }

    const stats = fs.statSync(filePath);
    console.info(`📊 File stats: size=${stats.size} bytes`);

    if (stats.size > SECURITY_LIMITS.MAX_FILE_SIZE) {
      console.info(`❌ File too large: ${stats.size} > ${SECURITY_LIMITS.MAX_FILE_SIZE}`);
      return { isValid: false, error: `文件過大，最大允許 ${Math.round(SECURITY_LIMITS.MAX_FILE_SIZE / 1024 / 1024)}MB` };
    }

    if (stats.size === 0) {
      console.info(`❌ File is empty`);
      return { isValid: false, error: '文件為空' };
    }

    const actualType = await detectFileType(filePath);
    console.info(`🔍 Detected file type: ${actualType}`);

    if (!actualType) {
      console.info(`❌ Could not detect file type`);
      return { isValid: false, error: '無法識別的文件格式' };
    }

    if (!SECURITY_LIMITS.ALLOWED_FILE_TYPES.includes(actualType)) {
      console.info(`❌ File type not allowed: ${actualType}`);
      console.info(`📋 Allowed types: ${SECURITY_LIMITS.ALLOWED_FILE_TYPES.join(', ')}`);
      return { isValid: false, error: '不支持的文件格式', actualType };
    }

    console.info(`✅ File type validation passed: ${actualType}`);

    // 🎯 傳遞文件類型給內容掃描函數
    const isContentSafe = await scanFileContent(filePath, actualType);
    if (!isContentSafe) {
      console.info(`❌ Content scan failed`);
      return { isValid: false, error: '文件內容不安全' };
    }

    console.info(`✅ All validations passed for: ${actualType}`);
    return { isValid: true, actualType };
  } catch (error) {
    console.error('❌ File validation error:', error);
    return { isValid: false, error: '文件驗證失敗' };
  }
};

// 修復：帶超時的 OCR 處理
const performOCRWithTimeout = (filePath: string): Promise<OCRResult> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('OCR 處理超時'));
    }, SECURITY_LIMITS.OCR_TIMEOUT_MS);

    const processOCR = async () => {
      try {
        console.info(`🔤 開始 OCR 處理: ${filePath}`);
        const startTime = Date.now();

        const worker = await Tesseract.createWorker('chi_tra+eng', 1, {
          cachePath: path.join(os.tmpdir(), 'tesseract-cache'),
          logger: (m) => {
            if (process.env.NODE_ENV === 'development' && process.env.ENABLE_SECURITY_LOGGING === 'true') {
              console.info('Tesseract:', m);
            }
          },
        });

        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
          tessedit_char_whitelist: '',
          preserve_interword_spaces: '1',
        });

        const result = await worker.recognize(filePath);
        await worker.terminate();

        clearTimeout(timeout);

        const processingTime = Date.now() - startTime;
        console.info(`✅ OCR 處理完成，耗時: ${processingTime}ms`);

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
      filter: ({ mimetype, originalFilename }) => {
        if (!mimetype || !originalFilename) return false;

        const isImage = mimetype.startsWith('image/');
        const hasValidExtension = /\.(jpg|jpeg|png|gif|webp|heic|heif|avif)$/i.test(originalFilename);

        return isImage || hasValidExtension;
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

      const sanitizedText = directText
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');

      result = { text: sanitizedText.trim(), confidence: 100 };
    }
    // 處理圖片 OCR
    else if (imageFile?.filepath) {
      try {
        incrementFileCount(sessionId);

        if (session.fileCount > SECURITY_LIMITS.MAX_FILES_PER_SESSION) {
          cleanupFile(imageFile.filepath);
          return res.status(400).json({
            success: false,
            error: `每個 session 最多允許 ${SECURITY_LIMITS.MAX_FILES_PER_SESSION} 個文件`,
          });
        }

        console.info(`📁 開始處理文件: ${imageFile.originalFilename}, 大小: ${imageFile.size} bytes`);

        const validation = await validateFile(imageFile.filepath);
        if (!validation.isValid) {
          cleanupFile(imageFile.filepath);
          console.info(`❌ 文件驗證失敗: ${validation.error}`);
          return res.status(400).json({ success: false, error: validation.error || '文件驗證失敗' });
        }

        console.info(`✅ 文件驗證通過，檢測到格式: ${validation.actualType}`);

        result = await performOCRWithTimeout(imageFile.filepath);

        console.info(`🎉 OCR 完成，耗時: ${Date.now() - startTime}ms, 置信度: ${result.confidence}%`);
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

    markSessionAsUsed(sessionId);
    session.result = result;

    console.info(
      `✅ 請求處理成功: sessionId=${sessionId}, IP=${clientIP}, textLength=${result.text.length}, confidence=${result.confidence}%`
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
