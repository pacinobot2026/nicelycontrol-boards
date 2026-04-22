import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'prospects.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read prospects from file
function readProspects() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading prospects:', err);
    return [];
  }
}

// Write prospects to file
function writeProspects(prospects) {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(prospects, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing prospects:', err);
    return false;
  }
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Get all prospects
    const prospects = readProspects();
    return res.status(200).json({ prospects });
  }

  if (req.method === 'POST') {
    // Add or update prospects
    const { prospects: newProspects } = req.body;
    
    if (!newProspects || !Array.isArray(newProspects)) {
      return res.status(400).json({ error: 'Invalid prospects data' });
    }

    const existingProspects = readProspects();
    
    // Update or add each prospect
    newProspects.forEach((newProspect) => {
      const index = existingProspects.findIndex((p) => p.id === newProspect.id);
      if (index >= 0) {
        // Update existing
        existingProspects[index] = {
          ...existingProspects[index],
          ...newProspect,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Add new
        existingProspects.push({
          ...newProspect,
          createdAt: newProspect.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    writeProspects(existingProspects);
    return res.status(200).json({ success: true, prospects: existingProspects });
  }

  if (req.method === 'DELETE') {
    // Delete a prospect
    const { prospectId } = req.body;
    
    if (!prospectId) {
      return res.status(400).json({ error: 'Prospect ID required' });
    }

    const prospects = readProspects();
    const filtered = prospects.filter((p) => p.id !== prospectId);
    writeProspects(filtered);
    
    return res.status(200).json({ success: true, prospects: filtered });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
