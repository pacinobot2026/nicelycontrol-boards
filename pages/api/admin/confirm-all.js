import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'pranay.8787@gmail.com';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getRequestingUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const requestingUser = await getRequestingUser(req);
  if (!requestingUser || requestingUser.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) return res.status(500).json({ error: error.message });

  const unverified = data.users.filter(u => !u.email_confirmed_at);

  let confirmed = 0;
  for (const u of unverified) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(u.id, {
      email_confirm: true,
    });
    if (!updateError) confirmed++;
  }

  return res.json({ confirmed, total: unverified.length });
}
