// Support & Operations API
// Integrates with support ticket system

export default async function handler(req, res) {
  try {
    // Mock data - replace with real support system API
    const supportData = {
      open: 18,
      urgent: 4,
      dfyPhase1: 3,
      dfyPhase2: 10,
      urgentTickets: [
        '#11289 - double tags',
        '#11288 - Signup form not storing subscribers',
        '#11271 - Domain name setup error'
      ]
    };

    res.status(200).json(supportData);
  } catch (error) {
    console.error('Support API error:', error);
    res.status(500).json({ error: 'Failed to fetch support data' });
  }
}
