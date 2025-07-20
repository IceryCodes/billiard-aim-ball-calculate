import { nanoid } from 'nanoid';
import { NextApiRequest, NextApiResponse } from 'next';
// import { NextApiRequest, NextApiResponse } from 'next';
import QRCode from 'qrcode';

import { cleanup, deleteSession, getSession, setSession } from '@/lib/sessions';
// import { cleanup, setSession, getSession, deleteSession } from '../../lib/sessions';

interface QRResponse {
  success: boolean;
  sessionId: string;
  qrCodeDataUrl: string;
  uploadUrl: string;
  expiresAt: string;
}

interface SessionStatusResponse {
  status: 'waiting' | 'completed' | 'expired' | 'not-found';
  result?: { text: string; confidence: number };
}

type QRApiResponse = QRResponse | SessionStatusResponse | { error: string };

const qrHandler = async (req: NextApiRequest, res: NextApiResponse<QRApiResponse>) => {
  // Vercel 環境每次請求都清理
  cleanup();

  if (req.method === 'POST') {
    const sessionId = nanoid(16); // 增加長度提高安全性
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes

    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    setSession(sessionId, {
      id: sessionId,
      createdAt: now,
      expiresAt,
      ip: clientIP as string,
      userAgent,
      fileCount: 0,
      used: false,
    });

    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const uploadUrl = `${protocol}://${host}/temp-image-upload?id=${sessionId}`;

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(uploadUrl, {
        width: 200,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      });

      console.info(`QR Code 生成成功: sessionId=${sessionId}, IP=${clientIP}`);

      return res.status(200).json({
        success: true,
        sessionId,
        qrCodeDataUrl,
        uploadUrl,
        expiresAt: new Date(expiresAt).toISOString(),
      });
    } catch (error) {
      console.error('生成 QR 碼失敗:', error);
      return res.status(500).json({ error: '生成 QR 碼失敗' });
    }
  }

  if (req.method === 'GET') {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing session ID' });
    }

    const session = getSession(id);

    if (!session) {
      return res.status(200).json({ status: 'not-found' });
    }

    if (Date.now() > session.expiresAt) {
      deleteSession(id);
      return res.status(200).json({ status: 'expired' });
    }

    if (session.result) {
      return res.status(200).json({ status: 'completed', result: session.result });
    }

    return res.status(200).json({ status: 'waiting' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

export default qrHandler;
