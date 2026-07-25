// Systems Health Check API
// Checks all Titanium platform APIs and critical URLs

export default async function handler(req, res) {
  try {
    const apis = [
      { name: 'MintBird/PopLinks', endpoint: 'https://api.poplinks.io/api/ai/bridge-pages', key: process.env.MINTBIRD_API_KEY ? `Bearer ${process.env.MINTBIRD_API_KEY}` : '' },
      { name: 'Global Control', endpoint: 'https://api.globalcontrol.io/api/ai/me', key: '' },
      { name: 'Course Sprout', endpoint: 'https://api.coursesprout.com/api/ai/courses', key: process.env.COURSESPROUT_API_KEY || '' },
      { name: 'Letterman', endpoint: 'https://api.letterman.io/api/ai/publications', key: process.env.LETTERMAN_API_KEY || '' },
      { name: 'SaaSOnboard', endpoint: 'https://api.saasonboard.com/api/ai/companies', key: process.env.SAASONBOARD_API_KEY || '' }
    ];

    const urls = [
      { name: 'chadnicely.com/members', url: 'https://chadnicely.com/members' },
      { name: 'entouragemastermind.org', url: 'https://entouragemastermind.org' },
      { name: 'westvalleyshoutouts.com', url: 'https://westvalleyshoutouts.com' },
      { name: 'Course Sprout Login', url: 'https://chadnicely.courseportal.io/login' },
      { name: 'MintBird Client', url: 'https://selfmasteryco.mintbird.com/' },
      { name: 'GC Client', url: 'https://selfmasteryco.globalcontrol.io' },
      { name: 'GC Admin', url: 'https://admin.globalcontrol.io' }
    ];

    // Check APIs (with timeout)
    const apiChecks = await Promise.allSettled(
      apis.map(api => 
        fetch(api.endpoint, {
          headers: (api.key || '').startsWith('Bearer') 
            ? { 'Authorization': api.key }
            : { 'X-API-KEY': api.key },
          signal: AbortSignal.timeout(5000)
        }).then(r => ({ name: api.name, status: r.ok ? 'online' : 'offline' }))
        .catch(() => ({ name: api.name, status: 'offline' }))
      )
    );

    // Check URLs (with timeout)
    const urlChecks = await Promise.allSettled(
      urls.map(item =>
        fetch(item.url, { signal: AbortSignal.timeout(5000) })
          .then(r => ({ name: item.name, status: r.ok || r.status === 302 ? 'online' : 'offline' }))
          .catch(() => ({ name: item.name, status: 'offline' }))
      )
    );

    const apiResults = apiChecks.map(r => r.value || { name: 'Unknown', status: 'offline' });
    const urlResults = urlChecks.map(r => r.value || { name: 'Unknown', status: 'offline' });

    const onlineApis = apiResults.filter(a => a.status === 'online').length;
    const onlineUrls = urlResults.filter(u => u.status === 'online').length;
    const total = apis.length + urls.length;
    const online = onlineApis + onlineUrls;

    res.status(200).json({
      apis: apiResults,
      urls: urlResults,
      online,
      total,
      allOnline: online === total,
      lastCheck: new Date().toISOString()
    });
  } catch (error) {
    console.error('Systems check error:', error);
    res.status(500).json({ error: 'Failed to check systems' });
  }
}
