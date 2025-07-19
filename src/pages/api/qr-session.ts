import { nanoid } from 'nanoid';
import { NextApiRequest, NextApiResponse } from 'next';
import QRCode from 'qrcode';

import { cleanup, setSession } from '../../lib/sessions';

interface QRResponse {
  success: boolean;
  sessionId: string;
  qrCodeDataUrl: string;
  expiresAt: string;
}

interface SessionStatusResponse {
  status: 'waiting' | 'completed' | 'expired' | 'not-found';
  result?: {
    text: string;
    confidence: number;
  };
}

interface ErrorResponse {
  error: string;
}

type ApiResponse = QRResponse | SessionStatusResponse | ErrorResponse;

const handler = async (req: NextApiRequest, res: NextApiResponse<ApiResponse>) => {
  cleanup();

  if (req.method === 'POST') {
    const sessionId = nanoid(12);
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes

    setSession(sessionId, {
      id: sessionId,
      createdAt: now,
      expiresAt,
    });

    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const uploadUrl = `${protocol}://${host}/temp-image-upload?id=${sessionId}`;

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(uploadUrl, {
        width: 200,
        margin: 1,
      });

      return res.status(200).json({
        success: true,
        sessionId,
        qrCodeDataUrl,
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

    const { getSession, deleteSession } = await import('../../lib/sessions');
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

export default handler;
