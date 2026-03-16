import { supabase } from '../../lib/supabase';

async function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

const TABLE_MAP = {
  api_key: 'cc_api_keys',
  model: 'cc_models',
  cron_job: 'cc_cron_jobs',
  task: 'cc_tasks',
  channel: 'cc_channels',
  integration: 'cc_integrations',
  feature: 'cc_features',
};

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // GET — return all sections in one request
  if (req.method === 'GET') {
    const uid = user.id;
    const order = { ascending: true };

    const [
      { data: apiKeys },
      { data: models },
      { data: cronJobs },
      { data: tasks },
      { data: channels },
      { data: integrations },
      { data: features },
    ] = await Promise.all([
      supabase.from('cc_api_keys').select('*').eq('user_id', uid).order('position', order),
      supabase.from('cc_models').select('*').eq('user_id', uid).order('position', order),
      supabase.from('cc_cron_jobs').select('*').eq('user_id', uid).order('position', order),
      supabase.from('cc_tasks').select('*').eq('user_id', uid).order('position', order),
      supabase.from('cc_channels').select('*').eq('user_id', uid).order('position', order),
      supabase.from('cc_integrations').select('*').eq('user_id', uid).order('position', order),
      supabase.from('cc_features').select('*').eq('user_id', uid).order('position', order),
    ]);

    return res.status(200).json({
      apiKeys: apiKeys || [],
      models: models || [],
      cronJobs: cronJobs || [],
      tasks: tasks || [],
      channels: channels || [],
      integrations: integrations || [],
      features: features || [],
    });
  }

  // POST — create a cc_ entity: body must include { entity, ...fields }
  if (req.method === 'POST') {
    const { entity, ...fields } = req.body;
    const table = TABLE_MAP[entity];
    if (!table) return res.status(400).json({ error: `Invalid entity. Must be one of: ${Object.keys(TABLE_MAP).join(', ')}` });

    const { data, error } = await supabase
      .from(table)
      .insert({ ...fields, user_id: user.id })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ item: data });
  }

  // PUT — update a cc_ entity: body must include { entity, id, ...fields }
  if (req.method === 'PUT') {
    const { entity, id, ...fields } = req.body;
    const table = TABLE_MAP[entity];
    if (!table) return res.status(400).json({ error: `Invalid entity` });
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { data, error } = await supabase
      .from(table)
      .update(fields)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ item: data });
  }

  // DELETE — body must include { entity, id }
  if (req.method === 'DELETE') {
    const { entity, id } = req.body;
    const table = TABLE_MAP[entity];
    if (!table) return res.status(400).json({ error: `Invalid entity` });
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
