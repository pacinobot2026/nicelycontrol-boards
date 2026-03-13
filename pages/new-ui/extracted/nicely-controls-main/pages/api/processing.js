import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  try {
    const VIZARD_API_KEY = process.env.VIZARD_API_KEY;

    // Fetch distinct vizard_project_ids from clips added in the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: clips, error } = await supabase
      .from('clips')
      .select('vizard_project_id')
      .not('vizard_project_id', 'is', null)
      .gte('created_at', since);

    if (error) throw error;

    const projectIds = [...new Set((clips || []).map(c => c.vizard_project_id))];

    if (projectIds.length === 0) {
      return res.status(200).json({ processing: 0 });
    }

    let processingCount = 0;

    for (const projectId of projectIds.slice(0, 5)) {
      try {
        const response = await fetch(
          `https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/query/${projectId}`,
          {
            headers: { 'VIZARDAI_API_KEY': VIZARD_API_KEY },
            signal: AbortSignal.timeout(3000),
          }
        );
        const data = await response.json();
        if (data.code === 1000) processingCount++;
      } catch {
        // Skip errors, continue
      }
    }

    return res.status(200).json({ processing: processingCount });
  } catch (error) {
    console.error('Processing check error:', error);
    return res.status(200).json({ processing: 0 });
  }
}
