// Products API
// Lists all active products and their URLs

export default async function handler(req, res) {
  try {
    const products = {
      active: [
        {
          name: 'OpenClaw FastStart',
          price: 17,
          url: 'https://openclaw-faststart-v2.vercel.app',
          status: 'live'
        },
        {
          name: 'ReviewRush',
          price: 47,
          url: 'https://reviewrush-pacino-bots-projects.vercel.app',
          status: 'live'
        },
        {
          name: 'AI Client Attraction Suite',
          price: 997,
          url: 'https://ai-client-attraction-suite.vercel.app',
          status: 'live'
        },
        {
          name: 'AiFreedom.PH Workshop',
          price: 0,
          url: 'https://aifreedom-ph-pacino-bots-projects.vercel.app',
          status: 'live'
        }
      ],
      paused: [],
      archived: []
    };

    res.status(200).json(products);
  } catch (error) {
    console.error('Products API error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}
