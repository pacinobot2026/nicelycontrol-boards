// Simple localStorage caching utility
// Cache expires after 10 minutes by default

const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

export function getCache(key) {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    // Check if expired
    if (now - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Cache read error:', err);
    return null;
  }
}

export function setCache(key, data) {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheObj = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheObj));
  } catch (err) {
    console.error('Cache write error:', err);
  }
}

export function clearCache(key) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error('Cache clear error:', err);
  }
}
