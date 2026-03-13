import { supabase } from '../../lib/supabase';

async function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

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
