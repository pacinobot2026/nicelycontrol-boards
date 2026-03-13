import { bulkUpdate } from '../../lib/storage';

export default async function handler(req, res) {
  // Password protection removed - public access

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clipIds, action, note } = req.body;

  if (!clipIds || !Array.isArray(clipIds) || clipIds.length === 0) {
    return res.status(400).json({ error: 'Clip IDs array required' });
  }

  if (!action) {
    return res.status(400).json({ error: 'Action required (approve/reject)' });
  }

  try {
    let updates = {};
    
    switch (action) {
      case 'approve':
        updates = { status: 'approved' };
        break;
      case 'reject':
        updates = { status: 'rejected', rejection_note: note || null };
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    const results = await bulkUpdate(clipIds, updates);
    const successCount = results.filter(r => r.success).length;

    return res.status(200).json({
      success: true,
      total: clipIds.length,
      successful: successCount,
      failed: clipIds.length - successCount,
      results
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return res.status(500).json({ error: 'Failed to perform bulk action' });
  }
}

