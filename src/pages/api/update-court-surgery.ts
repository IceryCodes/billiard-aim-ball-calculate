// update-court-surgery.ts
import { Collection, ObjectId } from 'mongodb';
import { NextApiRequest, NextApiResponse } from 'next';

import { CourtProps } from '@/domains/court';
import { getCourtsCollection } from '@/lib/mongodb';
import { broadcastToCourt, getConnectionsInfo } from '@/utils/connections';

interface UpdateSurgeryRequest {
  _id: string;
  surgery: boolean;
  tabId: string;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { _id, surgery, tabId } = req.body as UpdateSurgeryRequest;

  if (!_id || typeof surgery !== 'boolean' || !tabId) {
    return res.status(400).json({ message: 'Invalid request body' });
  }

  try {
    const courtsCollection: Collection<CourtProps> = await getCourtsCollection();

    // 檢查撞球場地是否存在
    const court = await courtsCollection.findOne({ _id: new ObjectId(_id) });
    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    // 如果狀態相同就不更新
    if (court.surgery === surgery) {
      return res.status(200).json({
        message: 'Surgery status unchanged',
        surgery,
        unchanged: true,
      });
    }

    const connectionInfo = getConnectionsInfo();

    if (connectionInfo.totalConnections === 0) {
      console.warn('[Surgery Update] No active connections found');
    }

    // 更新資料庫
    await courtsCollection.updateOne({ _id: new ObjectId(_id) }, { $set: { surgery } });

    // 準備廣播數據
    const broadcastData = {
      courtId: _id,
      surgery,
      timestamp: Date.now(),
      tabId,
    };

    // 廣播到所有連接的客戶端
    const { success, failed } = broadcastToCourt(_id, 'surgeryUpdate', broadcastData);

    // Check status
    // const courtUpdated: WithId<CourtProps> | null = await courtsCollection.findOne({
    //   _id: new ObjectId(_id),
    // });
    // console.log(`[Surgery Update] Tab ${courtUpdated?.title} updated surgery status to ${surgery}`);
    // console.log(`[Surgery Update] Broadcast results: ${success} successful, ${failed} failed`);

    return res.status(200).json({
      message: 'Surgery status updated successfully',
      surgery,
      broadcast: { success, failed },
    });
  } catch (error) {
    console.error('[Surgery Update] Error:', error);
    return res.status(500).json({
      message: 'Failed to update surgery status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export default handler;
