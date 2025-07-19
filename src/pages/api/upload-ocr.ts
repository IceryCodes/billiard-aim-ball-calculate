import fs from 'fs';
import os from 'os';
import path from 'path';

import formidable from 'formidable';
import { NextApiRequest, NextApiResponse } from 'next';
import Tesseract from 'tesseract.js';

import { deleteSession, getSession } from '../../lib/sessions';

interface OCRResult {
  text: string;
  confidence: number;
}

interface UploadSuccessResponse {
  success: true;
  text: string;
  confidence: number;
}

interface UploadErrorResponse {
  success: false;
  error: string;
}

type UploadResponse = UploadSuccessResponse | UploadErrorResponse;

// 禁用 Next.js 默認的 body parser，因為我們要處理文件上傳
export const config = {
  api: {
    bodyParser: false,
  },
};

const performOCR = async (filePath: string): Promise<OCRResult> => {
  // 使用自定義的 worker 路徑，避免下載到項目目錄
  const worker = await Tesseract.createWorker('chi_tra+eng', 1, {
    cachePath: path.join(os.tmpdir(), 'tesseract-cache'), // 使用系統臨時目錄
    logger: () => {
      // 空的 logger 函數，禁用日誌輸出
    },
  });

  // 設定 PSM (Page Segmentation Mode) 為 6 (統一文字塊)
  await worker.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
  });

  const result = await worker.recognize(filePath);

  await worker.terminate();

  return {
    text: result.data.text.trim(),
    confidence: result.data.confidence,
  };
};

const parseForm = (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((resolve, reject) => {
    // 使用系統臨時目錄
    const uploadDir = os.tmpdir();

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
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

const handler = async (req: NextApiRequest, res: NextApiResponse<UploadResponse>) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { fields, files } = await parseForm(req);

    const sessionId = Array.isArray(fields.sessionId) ? fields.sessionId[0] : fields.sessionId;
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
    const directText = Array.isArray(fields.directText) ? fields.directText[0] : fields.directText;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        success: false,
        error: '缺少 Session ID',
      });
    }

    const session = getSession(sessionId);

    if (!session) {
      // 清理臨時文件（如果有的話）
      if (imageFile?.filepath) {
        try {
          fs.unlinkSync(imageFile.filepath);
        } catch (cleanupError) {
          console.error('清理臨時文件失敗:', cleanupError);
        }
      }

      return res.status(404).json({
        success: false,
        error: 'Session 不存在',
      });
    }

    if (Date.now() > session.expiresAt) {
      deleteSession(sessionId);

      // 清理臨時文件（如果有的話）
      if (imageFile?.filepath) {
        try {
          fs.unlinkSync(imageFile.filepath);
        } catch (cleanupError) {
          console.error('清理臨時文件失敗:', cleanupError);
        }
      }

      return res.status(410).json({
        success: false,
        error: 'Session 已過期',
      });
    }

    let result: OCRResult;

    // 處理直接文字輸入
    if (directText && typeof directText === 'string') {
      result = {
        text: directText.trim(),
        confidence: 100, // 直接輸入的文字設定信心度為100%
      };
    }
    // 處理圖片 OCR
    else if (imageFile?.filepath) {
      result = await performOCR(imageFile.filepath);

      // 清理臨時文件
      try {
        fs.unlinkSync(imageFile.filepath);
      } catch (cleanupError) {
        console.error('清理臨時文件失敗:', cleanupError);
      }
    } else {
      return res.status(400).json({
        success: false,
        error: '缺少圖片文件或文字內容',
      });
    }

    // 更新 session 結果
    session.result = result;

    return res.status(200).json({
      success: true,
      text: result.text,
      confidence: result.confidence,
    });
  } catch (error) {
    console.error('OCR error:', error);
    return res.status(500).json({
      success: false,
      error: '處理失敗',
    });
  }
};

export default handler;
