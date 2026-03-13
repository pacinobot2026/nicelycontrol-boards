const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jqqvqdjxviqnsgpxcgfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcXZxZGp4dmlxbnNncHhjZ2ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk2MjIwOSwiZXhwIjoyMDg3NTM4MjA5fQ.ibJyHrxx2TlfRbfh-9IKD3-kY9aSXAfrDJ1ZHVFijOQ';

const supabase = createClient(supabaseUrl, supabaseKey);

const ideas = [
  { title: 'Add AI article writer to Letterman', description: 'Generate full local news articles from topics with one click', category: 'Product', status: 'backlog', priority: 'high', tags: ['letterman', 'ai', 'content'] },
  { title: 'PopLinks bridge page A/B testing', description: 'Built-in split testing for bridge pages with analytics', category: 'Product', status: 'backlog', priority: 'medium', tags: ['poplinks', 'testing', 'analytics'] },
  { title: 'Global Control Zapier integration', description: 'Connect GC to 5000+ apps via Zapier', category: 'Product', status: 'backlog', priority: 'high', tags: ['global-control', 'integration', 'automation'] },
  { title: 'Course Sprout mobile app', description: 'Native iOS/Android app for students', category: 'Product', status: 'backlog', priority: 'low', tags: ['course-sprout', 'mobile', 'app'] },
  { title: 'Local business sponsor finder tool', description: 'AI-powered tool to find and pitch local sponsors for newsletters', category: 'Product', status: 'backlog', priority: 'high', tags: ['newsletter', 'monetization', 'local'] },
  { title: 'MintBird upsell builder', description: 'Drag-and-drop upsell/downsell flow creator', category: 'Product', status: 'backlog', priority: 'medium', tags: ['mintbird', 'upsells', 'funnel'] },
  { title: 'Newsletter Hour replay vault in Course Sprout', description: 'Organized library of all Newsletter Hour recordings with searchable transcripts', category: 'Content', status: 'backlog', priority: 'medium', tags: ['newsletter-hour', 'course-sprout', 'replays'] },
  { title: 'Entourage private Slack/Discord', description: 'Premium community channel for Entourage members', category: 'Community', status: 'backlog', priority: 'low', tags: ['entourage', 'community', 'engagement'] },
  { title: 'PopLinks QR code generator', description: 'Generate QR codes for any poplink with tracking', category: 'Product', status: 'backlog', priority: 'low', tags: ['poplinks', 'qr-code', 'tracking'] },
  { title: 'Letterman RSS auto-import', description: 'Auto-pull content from RSS feeds and format as articles', category: 'Product', status: 'backlog', priority: 'medium', tags: ['letterman', 'automation', 'rss'] },
  { title: 'GC email warmup tool', description: 'Built-in email warmup to improve deliverability', category: 'Product', status: 'backlog', priority: 'high', tags: ['global-control', 'email', 'deliverability'] },
  { title: 'Student spotlight series', description: 'Monthly feature of successful Entourage members with case studies', category: 'Content', status: 'backlog', priority: 'medium', tags: ['entourage', 'case-study', 'marketing'] },
  { title: 'Course Sprout gamification upgrade', description: 'Add leaderboards, achievements, and rewards system', category: 'Product', status: 'backlog', priority: 'low', tags: ['course-sprout', 'gamification', 'engagement'] },
  { title: 'Local newsletter template marketplace', description: 'Pre-built Letterman templates for different niches', category: 'Product', status: 'backlog', priority: 'medium', tags: ['letterman', 'templates', 'marketplace'] },
  { title: 'MintBird affiliate dashboard', description: 'Better affiliate tracking and management tools', category: 'Product', status: 'backlog', priority: 'medium', tags: ['mintbird', 'affiliates', 'tracking'] },
  { title: 'AI-powered email subject line tester', description: 'Test subject lines for open rate prediction before sending', category: 'Product', status: 'backlog', priority: 'medium', tags: ['global-control', 'ai', 'email'] },
  { title: 'Round Table private podcast feed', description: 'Audio-only feed of Round Table sessions for members', category: 'Content', status: 'backlog', priority: 'low', tags: ['round-table', 'podcast', 'content'] },
  { title: 'PopLinks Instagram bio link page', description: 'Linktree competitor built into PopLinks', category: 'Product', status: 'backlog', priority: 'high', tags: ['poplinks', 'social', 'bio-link'] },
  { title: 'Letterman ad network connector', description: 'One-click integration with Mediavine, AdThrive, Ezoic', category: 'Product', status: 'backlog', priority: 'high', tags: ['letterman', 'ads', 'monetization'] },
  { title: 'Titanium Suite unified dashboard', description: 'Single dashboard showing stats from all 6 platforms', category: 'Product', status: 'backlog', priority: 'high', tags: ['titanium', 'dashboard', 'analytics'] }
];

async function populateIdeas() {
  console.log('Adding business-specific ideas...\n');
  
  const userId = '9bc76121-2f9b-41d3-9821-2380754a4a06';
  
  for (const idea of ideas) {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .insert([{ ...idea, user_id: userId }])
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed: ${idea.title}`);
        console.error(error.message);
      } else {
        console.log(`✅ Added: ${idea.title}`);
      }
    } catch (err) {
      console.error(`❌ Error on ${idea.title}:`, err.message);
    }
  }
  
  console.log('\n✅ Done! Business-specific ideas added.');
}

populateIdeas();
