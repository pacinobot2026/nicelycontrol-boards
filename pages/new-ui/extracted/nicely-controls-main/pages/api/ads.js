// Ad Performance API (LNH Campaign)
// Integrates with ad platform APIs

export default async function handler(req, res) {
  try {
    // Mock data - replace with real ad platform API (Facebook/Google)
    const adsData = {
      mtdSpend: 3797,
      mtdSales: 1607,
      mtdRoas: 0.42,
      mtdProfit: -2190,
      mtdCac: 74.46,
      yesterdaySpend: 121.69,
      yesterdaySales: 32,
      yesterdayRoas: 0.26,
      yesterdayProfit: -89.69
    };

    res.status(200).json(adsData);
  } catch (error) {
    console.error('Ads API error:', error);
    res.status(500).json({ error: 'Failed to fetch ad data' });
  }
}
