// Systems Health Check API
// Checks all Titanium platform APIs and critical URLs

export default async function handler(req, res) {
  try {
    // Credentials come from the environment. They were previously hardcoded
    // here in plaintext, which put them in git history permanently.
    //
    // `auth` selects the header scheme: 'bearer' → Authorization: Bearer <key>,
    // 'apikey' → X-API-KEY: <key>. Entries with no key configured are reported
    // as 'unconfigured' rather than silently counted as offline.
    const apis = [
      {
        name: 'MintBird/PopLinks',
        endpoint: 'https://api.poplinks.io/api/ai/bridge-pages',
        key: process.env.MINTBIRD_API_KEY,
        auth: 'bearer',
      },
      {
        // /api/ai/me returns 401 even with a valid API key — it appears to want
        // a user session token, not an API key. Using it as the health check
        // reported Global Control as permanently offline. /api/ai/tags is a
        // cheap read that works with the API key.
        name: 'Global Control',
        endpoint: 'https://api.globalcontrol.io/api/ai/tags',
        key: process.env.GLOBALCONTROL_API_KEY,
        auth: 'apikey',
      },
      {
        name: 'Course Sprout',
        endpoint: 'https://api.coursesprout.com/api/ai/courses',
        key: process.env.COURSESPROUT_API_KEY,
        auth: 'apikey',
      },
      {
        // Letterman moved to api.letterman.ai with no /api/ai prefix; the old
        // api.letterman.io/api/ai/publications path 404s. See
        // titanium-apps/letterman/README.md.
        name: 'Letterman',
        endpoint: 'https://api.letterman.ai/publications',
        key: process.env.LETTERMAN_API_KEY,
        auth: 'bearer',
      },
      {
        name: 'SaaSOnboard',
        endpoint: 'https://api.saasonboard.com/api/ai/companies',
        key: process.env.SAASONBOARD_API_KEY,
        auth: 'apikey',
      },
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
      apis.map(api => {
        if (!api.key) {
          // Distinguish "no credential set" from "the service is down" —
          // reporting a missing key as offline sends you debugging the wrong thing.
          return Promise.resolve({ name: api.name, status: 'unconfigured' });
        }
        const headers = api.auth === 'bearer'
          ? { Authorization: `Bearer ${api.key}` }
          : { 'X-API-KEY': api.key };
        return fetch(api.endpoint, { headers, signal: AbortSignal.timeout(5000) })
          .then(r => ({ name: api.name, status: r.ok ? 'online' : 'offline', code: r.status }))
          .catch(() => ({ name: api.name, status: 'offline' }));
      })
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
    const unconfigured = apiResults.filter(a => a.status === 'unconfigured').length;
    // Unconfigured services aren't failures, so exclude them from the total
    // rather than letting a missing key permanently show as "not all online".
    const total = apis.length + urls.length - unconfigured;
    const online = onlineApis + onlineUrls;

    res.status(200).json({
      apis: apiResults,
      urls: urlResults,
      online,
      total,
      allOnline: online === total,
      unconfigured,
      lastCheck: new Date().toISOString()
    });
  } catch (error) {
    console.error('Systems check error:', error);
    res.status(500).json({ error: 'Failed to check systems' });
  }
}
