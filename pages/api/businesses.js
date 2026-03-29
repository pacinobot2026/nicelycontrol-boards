import { kv } from '@vercel/kv';

const KV_KEY = 'businesses';

async function readData() {
  try {
    const data = await kv.get(KV_KEY);
    // Fail closed: if KV returns null/empty, return error instead of empty array
    if (!data) {
      return null;
    }
    return data;
  } catch (err) {
    console.error('Error reading businesses data from KV:', err);
    return null;
  }
}

async function writeData(data) {
  try {
    await kv.set(KV_KEY, data);
    return true;
  } catch (err) {
    console.error('Error writing businesses data to KV:', err);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await readData();
    
    // Fail closed: return 500 if no data exists (prevents silent data loss)
    if (!data) {
      return res.status(500).json({ 
        error: 'No data in KV store. Run seed-kv to initialize.' 
      });
    }
    
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { action, business } = req.body;
    const data = await readData();
    
    // Fail closed: don't operate on null data
    if (!data) {
      return res.status(500).json({ 
        error: 'No data in KV store. Run seed-kv to initialize.' 
      });
    }

    if (action === 'add') {
      data.businesses.push(business);
      const success = await writeData(data);
      if (!success) {
        return res.status(500).json({ error: 'Failed to write to KV' });
      }
      return res.status(200).json({ success: true, business });
    }

    if (action === 'update') {
      const index = data.businesses.findIndex(b => b.id === business.id);
      if (index !== -1) {
        data.businesses[index] = business;
        const success = await writeData(data);
        if (!success) {
          return res.status(500).json({ error: 'Failed to write to KV' });
        }
        return res.status(200).json({ success: true, business });
      }
      return res.status(404).json({ error: 'Business not found' });
    }

    if (action === 'delete') {
      data.businesses = data.businesses.filter(b => b.id !== business.id);
      const success = await writeData(data);
      if (!success) {
        return res.status(500).json({ error: 'Failed to write to KV' });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
