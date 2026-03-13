import { updateClip } from '../../lib/storage';

export default async function handler(req, res) {
  // Password protection removed - public access

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clipId, note } = req.body;

  if (!clipId) {
    return res.status(400).json({ error: 'Clip ID required' });
  }

  try {
    const updatedClip = await updateClip(clipId, {
      status: 'rejected',
      rejection_note: note || null
    });

    return res.status(200).json({
      success: true,
      clip: updatedClip
    });
  } catch (error) {
    console.error('Error rejecting clip:', error);
    return res.status(500).json({ error: 'Failed to reject clip' });
  }
}
