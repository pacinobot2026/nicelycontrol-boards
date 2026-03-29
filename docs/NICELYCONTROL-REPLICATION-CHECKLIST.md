# NicelyControl - Complete Replication Checklist

## Prerequisites
- GitHub account
- Vercel account
- Supabase account
- Domain (optional, can use Vercel subdomain)

---

## Step 1: Supabase Project Setup

### 1.1 Create New Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name:** `nicelycontrol-production` (or your choice)
   - **Database Password:** Generate strong password (save it!)
   - **Region:** Choose closest to your users
4. Wait for project to provision (~2 minutes)

### 1.2 Get Supabase Credentials
1. In project dashboard, go to Settings > API
2. Copy these values (you'll need them later):
   - **Project URL:** `https://YOUR_PROJECT_REF.supabase.co`
   - **Anon/Public Key:** `eyJhbGci...` (long JWT)
   - **Service Role Key:** `eyJhbGci...` (different JWT, secret!)

### 1.3 Create Articles Table (if using article board)
```sql
-- Run in Supabase SQL Editor
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  description TEXT,
  image_url TEXT,
  publication_id TEXT,
  status TEXT DEFAULT 'pending',
  letterman_id TEXT,
  letterman_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on status for faster queries
CREATE INDEX idx_articles_status ON articles(status);

-- Create index on publication
CREATE INDEX idx_articles_publication ON articles(publication_id);
```

### 1.4 Disable Email Confirmation (CRITICAL!)
1. Go to Authentication > Providers > Email
2. **Uncheck** "Confirm email"
3. Save changes
4. This fixes the registration error

---

## Step 2: Vercel KV Setup

### 2.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub

### 2.2 Create KV Database
1. In Vercel dashboard, go to Storage tab
2. Click "Create Database"
3. Select **KV (Redis)**
4. Name: `nicelycontrol-kv`
5. Region: Same as Vercel deployment region
6. Click "Create"

### 2.3 Get KV Credentials
1. After creation, go to database settings
2. Click ".env.local" tab
3. Copy:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

---

## Step 3: GitHub Repository Setup

### 3.1 Fork Repository
**Option A: Fork from Chad's repo (if public)**
1. Go to https://github.com/pacinobot2026/nicelycontrol-boards
2. Click "Fork"
3. Choose your account

**Option B: Clone manually**
```bash
git clone https://github.com/pacinobot2026/nicelycontrol-boards.git
cd nicelycontrol-boards
git remote remove origin
git remote add origin YOUR_NEW_REPO_URL
git push -u origin main
```

### 3.2 Update Environment Variables (Local)
Create `.env.local` in project root:

```env
# Supabase (from Step 1.2)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...YOUR_ANON_KEY
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...YOUR_SERVICE_ROLE_KEY

# Vercel KV (from Step 2.3)
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...

# Optional: If using article board
GATEWAY_URL=http://localhost:18789
GATEWAY_TOKEN=your_gateway_token

# Optional: External integrations
VIMEO_ACCESS_TOKEN=
VIMEO_USER_ID=
VIZARD_API_KEY=
POSTBRIDGE_API_KEY=
```

---

## Step 4: Vercel Deployment

### 4.1 Connect to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel auto-detects Next.js
4. Click "Deploy"

### 4.2 Add Environment Variables in Vercel
1. In project settings, go to "Environment Variables"
2. Add each variable from `.env.local`:
   - Click "Add"
   - Paste variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Paste value
   - Select all environments (Production, Preview, Development)
   - Save
3. **CRITICAL:** Add all Supabase and KV variables

### 4.3 Redeploy After Adding Variables
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Wait for build to complete

---

## Step 5: Seed Initial Data

### 5.1 Create First User
**Option A: Via UI**
1. Visit your deployed URL (e.g., `nicelycontrol.vercel.app`)
2. Click "Register"
3. Enter email/password
4. Should work now (email confirmation disabled)

**Option B: Via Supabase Dashboard**
1. Go to Supabase > Authentication > Users
2. Click "Add User"
3. Enter email, password
4. Mark as verified

### 5.2 Seed ReviewRush Business (Optional)
```bash
# Run this to add sample business data
curl -X POST https://YOUR_VERCEL_URL/api/businesses \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add",
    "business": {
      "id": "reviewrush-001",
      "name": "ReviewRush",
      "columns": ["Marketing", "Follow-up", "Research", "Delivery"],
      "cards": [],
      "resources": [],
      "createdAt": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }'
```

---

## Step 6: Fix Multi-Tenant Issues (CRITICAL!)

### 6.1 Add Auth Middleware
Create `lib/auth-middleware.js`:

```javascript
import { supabase } from './supabase';

export async function requireAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { error: 'Invalid token', status: 401 };
  }

  return { user, status: 200 };
}
```

### 6.2 Update `/api/businesses.js` to Use User Isolation
Replace entire file with:

```javascript
import { kv } from '@vercel/kv';
import { requireAuth } from '../../lib/auth-middleware';

export default async function handler(req, res) {
  // Require authentication
  const auth = await requireAuth(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }
  const userId = auth.user.id;

  // Use per-user KV key
  const KV_KEY = `businesses:${userId}`;

  if (req.method === 'GET') {
    const data = await kv.get(KV_KEY) || { businesses: [] };
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { action, business } = req.body;
    const data = await kv.get(KV_KEY) || { businesses: [] };

    if (action === 'add') {
      data.businesses.push(business);
      await kv.set(KV_KEY, data);
      return res.status(200).json({ success: true, business });
    }

    if (action === 'update') {
      const index = data.businesses.findIndex(b => b.id === business.id);
      if (index !== -1) {
        data.businesses[index] = business;
        await kv.set(KV_KEY, data);
        return res.status(200).json({ success: true, business });
      }
      return res.status(404).json({ error: 'Business not found' });
    }

    if (action === 'delete') {
      data.businesses = data.businesses.filter(b => b.id !== business.id);
      await kv.set(KV_KEY, data);
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

### 6.3 Update Frontend to Send Auth Token
In `pages/businesses.js`, update all fetch calls:

```javascript
// Before
const res = await fetch("/api/businesses");

// After
const { session } = useAuth(); // Import from authContext
const res = await fetch("/api/businesses", {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});
```

---

## Step 7: Verification & Testing

### 7.1 Test Authentication
1. Visit login page
2. Create account
3. Verify redirect to dashboard

### 7.2 Test Business CRUD
1. Create new business
2. Add cards to columns
3. Refresh page - verify persistence
4. Edit business name - verify save
5. Delete business - verify removal

### 7.3 Test User Isolation
1. Create second user account
2. Login as User 2
3. Verify they DON'T see User 1's businesses
4. Create business as User 2
5. Switch back to User 1 - verify they DON'T see User 2's business

### 7.4 Test Article Board (if applicable)
1. Navigate to `/articles`
2. Verify table loads (may be empty)
3. Test approve/disapprove workflow

---

## Step 8: Production Hardening

### 8.1 Add Custom Domain (Optional)
1. Vercel Dashboard > Domains
2. Add your domain
3. Update DNS records as instructed

### 8.2 Enable HTTPS (Automatic)
- Vercel auto-provisions SSL certificates

### 8.3 Set Up Monitoring
1. Vercel Analytics (built-in)
2. Supabase logs
3. Vercel KV monitoring

---

## Troubleshooting

### Registration Fails
- Check: Email confirmation disabled in Supabase
- Check: Supabase URL/keys correct in env vars

### Businesses Not Persisting
- Check: KV credentials correct
- Check: `/api/businesses` returns 200
- Check: Browser console for errors

### Users See Each Other's Data
- Fix: Implement auth middleware (Step 6)
- Fix: Use per-user KV keys

### API Returns 405/500
- Check: Vercel logs for errors
- Check: All env vars set in Vercel dashboard
- Redeploy after adding env vars

---

## Maintenance

### Updates
- Pull latest from upstream repo
- Test locally before deploying
- Deploy via Vercel (auto on git push)

### Backups
- Supabase: Auto-backups enabled
- Vercel KV: No built-in backup (export manually if needed)

---

## Cost Estimate

- **Supabase Free Tier:** $0 (up to 500MB database, 50,000 monthly active users)
- **Vercel Hobby:** $0 (100GB bandwidth, unlimited deployments)
- **Vercel KV:** ~$0.25/month (30MB free, $0.25/GB after)
- **Custom Domain:** $10-15/year (optional)

**Total:** $0-3/month for small usage

---

## Security Checklist

- [ ] Email confirmation disabled (for testing) or enabled (for production)
- [ ] Service role key never exposed to frontend
- [ ] Auth middleware protecting all API routes
- [ ] Per-user KV keys implemented
- [ ] HTTPS enabled (Vercel default)
- [ ] Environment variables not committed to git
- [ ] `.env.local` in `.gitignore`

---

## Next Steps

1. Deploy to production
2. Invite first users
3. Monitor for issues
4. Iterate based on feedback
5. Consider adding:
   - Email notifications
   - Webhooks
   - Team collaboration features
   - Export/import functionality
