import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

const KV_KEY = 'businesses';
const DATA_FILE = path.join(process.cwd(), 'data', 'businesses.json');

/**
 * ONE-TIME SEED ROUTE
 * 
 * Purpose: Migrate existing data/businesses.json to Vercel KV
 * 
 * Usage:
 *   curl -X POST https://nicelycontrol.com/api/seed-kv \
 *     -H "x-admin-token: YOUR_ADMIN_TOKEN"
 * 
 * After successful seed:
 *   1. Remove this file (pages/api/seed-kv.js)
 *   2. Remove ADMIN_TOKEN from Vercel env vars
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin token
  const adminToken = req.headers['x-admin-token'];
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Forbidden: Invalid or missing admin token' });
  }

  try {
    // Check if KV already has data (prevent accidental re-seed)
    const existingData = await kv.get(KV_KEY);
    if (existingData) {
      return res.status(409).json({ 
        error: 'KV store already contains data. Refusing to overwrite.',
        hint: 'If you need to re-seed, manually delete the KV key first.'
      });
    }

    // Read current filesystem data
    if (!fs.existsSync(DATA_FILE)) {
      return res.status(404).json({ 
        error: 'Source file not found: data/businesses.json' 
      });
    }

    const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
    const currentData = JSON.parse(fileData);

    // Validate structure
    if (!currentData.businesses || !Array.isArray(currentData.businesses)) {
      return res.status(400).json({ 
        error: 'Invalid data structure: expected { businesses: [...] }' 
      });
    }

    // Seed to KV
    await kv.set(KV_KEY, currentData);

    return res.status(200).json({
      success: true,
      message: 'Data seeded to Vercel KV successfully',
      businessCount: currentData.businesses.length,
      nextSteps: [
        '1. Verify GET /api/businesses returns 200 with data',
        '2. Test POST /api/businesses (add/update/delete)',
        '3. Trigger Vercel redeploy and confirm data persists',
        '4. Delete this seed route (pages/api/seed-kv.js)',
        '5. Remove ADMIN_TOKEN from Vercel env vars'
      ]
    });
  } catch (err) {
    console.error('Seed error:', err);
    return res.status(500).json({ 
      error: 'Failed to seed KV store',
      details: err.message 
    });
  }
}
