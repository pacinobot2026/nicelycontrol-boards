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
  // Verify the requesting user is the admin
  const requestingUser = await getRequestingUser(req);
  if (!requestingUser || requestingUser.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // GET /api/admin/users — list all users
  if (req.method === 'GET') {
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ users: data.users });
  }

  // POST /api/admin/users — reset a user's password
  if (req.method === 'POST') {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'userId and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, user: data.user });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
