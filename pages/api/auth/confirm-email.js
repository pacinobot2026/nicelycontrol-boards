import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
}
