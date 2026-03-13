import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'businesses.json');

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading businesses data:', err);
  }
  return { businesses: [] };
}

function writeData(data) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing businesses data:', err);
    return false;
  }
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    const data = readData();
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { action, business } = req.body;
    const data = readData();

    if (action === 'add') {
      data.businesses.push(business);
      writeData(data);
      return res.status(200).json({ success: true, business });
    }

    if (action === 'update') {
      const index = data.businesses.findIndex(b => b.id === business.id);
      if (index !== -1) {
        data.businesses[index] = business;
        writeData(data);
        return res.status(200).json({ success: true, business });
      }
      return res.status(404).json({ error: 'Business not found' });
    }

    if (action === 'delete') {
      data.businesses = data.businesses.filter(b => b.id !== business.id);
      writeData(data);
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
