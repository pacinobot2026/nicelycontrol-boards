// Sales & Revenue API
// This would integrate with Stripe/payment processor in production

export default async function handler(req, res) {
  try {
    // Mock data - replace with real Stripe API integration
    const salesData = {
      mtd: 14038,
      mtdOrders: 107,
      yesterday: 1026,
      yesterdayOrders: 3,
      today: 0,
      todayOrders: 0,
      avgOrderValue: 131.19,
      trend: 15.3
    };

    res.status(200).json(salesData);
  } catch (error) {
    console.error('Sales API error:', error);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
}
