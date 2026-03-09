/**
 * Wake Pacino endpoint
 * Sends a wake event to trigger OpenClaw agent
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3100';
    const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN;

    if (!GATEWAY_TOKEN) {
      return res.status(500).json({ error: 'Gateway token not configured' });
    }

    const response = await fetch(`${GATEWAY_URL}/api/cron/wake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`
      },
      body: JSON.stringify({
        text: '🔔 WAKE BUTTON PRESSED - User needs attention on Control Board!',
        mode: 'now'
      })
    });

    if (!response.ok) {
      throw new Error(`Wake failed: ${response.statusText}`);
    }

    const data = await response.json();
    return res.status(200).json({ 
      success: true, 
      message: 'Wake event sent',
      data 
    });

  } catch (error) {
    console.error('Wake error:', error);
    return res.status(500).json({ 
      error: 'Failed to send wake event',
      details: error.message 
    });
  }
}
