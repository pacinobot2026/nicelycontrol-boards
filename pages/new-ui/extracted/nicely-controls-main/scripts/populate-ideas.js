const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jqqvqdjxviqnsgpxcgfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcXZxZGp4dmlxbnNncHhjZ2ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk2MjIwOSwiZXhwIjoyMDg3NTM4MjA5fQ.ibJyHrxx2TlfRbfh-9IKD3-kY9aSXAfrDJ1ZHVFijOQ';

const supabase = createClient(supabaseUrl, supabaseKey);

const ideas = [
  { title: 'AI-Powered Course Creator Webinar', description: 'Show how to use AI to create complete course content in 24 hours', category: 'Content', status: 'backlog', priority: 'high', tags: ['ai', 'course', 'automation'] },
  { title: 'Local Newsletter Empire Workshop', description: 'Build and monetize local newsletters with ads, sponsors, and affiliate boxes', category: 'Marketing', status: 'backlog', priority: 'high', tags: ['newsletter', 'local', 'monetization'] },
  { title: '7-Figure Funnel Teardown Series', description: 'Live teardowns of successful sales funnels with actionable insights', category: 'Marketing', status: 'backlog', priority: 'medium', tags: ['funnel', 'sales', 'conversion'] },
  { title: 'Zero to Launch in 30 Days Challenge', description: 'Complete product creation and launch workshop with daily accountability', category: 'Product', status: 'backlog', priority: 'high', tags: ['launch', 'product', 'challenge'] },
  { title: 'VSL Masterclass with Live Creation', description: 'Create a complete VSL from script to video in one session', category: 'Content', status: 'backlog', priority: 'medium', tags: ['vsl', 'video', 'sales'] },
  { title: 'Email Reactivation Bootcamp', description: 'Advanced strategies for re-engaging dead email lists', category: 'Email', status: 'backlog', priority: 'medium', tags: ['email', 'reactivation', 'engagement'] },
  { title: 'PopLinks Power User Training', description: 'Advanced bridge page and link tracking strategies', category: 'Tools', status: 'backlog', priority: 'low', tags: ['poplinks', 'tracking', 'bridge-pages'] },
  { title: 'AI Automation for Solopreneurs', description: 'Build automated workflows with OpenClaw and AI tools', category: 'Automation', status: 'backlog', priority: 'high', tags: ['ai', 'automation', 'workflow'] },
  { title: 'Profitable Product Suite Workshop', description: 'Create and bundle multiple offers for maximum revenue', category: 'Product', status: 'backlog', priority: 'medium', tags: ['product-suite', 'bundling', 'revenue'] },
  { title: 'Conversion Copywriting Intensive', description: '3-hour deep dive on writing high-converting sales copy', category: 'Content', status: 'backlog', priority: 'high', tags: ['copywriting', 'conversion', 'sales'] },
  { title: 'Local Business Lead Gen System', description: 'Generate and sell leads to local businesses at scale', category: 'Business', status: 'backlog', priority: 'medium', tags: ['lead-gen', 'local', 'b2b'] },
  { title: 'Webinar Replay Monetization Strategy', description: 'Turn one webinar into 10+ revenue streams', category: 'Marketing', status: 'backlog', priority: 'low', tags: ['webinar', 'replay', 'monetization'] },
  { title: 'Authority Builder Accelerator', description: 'Position yourself as the go-to expert in your niche', category: 'Marketing', status: 'backlog', priority: 'medium', tags: ['authority', 'branding', 'positioning'] },
  { title: 'Affiliate Marketing 2.0', description: 'Modern affiliate strategies that actually work', category: 'Marketing', status: 'backlog', priority: 'low', tags: ['affiliate', 'marketing', 'passive-income'] },
  { title: 'Community Monetization Blueprint', description: 'Build and monetize engaged online communities', category: 'Business', status: 'backlog', priority: 'medium', tags: ['community', 'membership', 'monetization'] },
  { title: 'Live Launch Dashboard Build', description: 'Build a complete product launch dashboard in real-time', category: 'Tools', status: 'backlog', priority: 'low', tags: ['dashboard', 'launch', 'tools'] },
  { title: 'Content Repurposing System', description: 'Turn one piece of content into 100+ assets', category: 'Content', status: 'backlog', priority: 'medium', tags: ['content', 'repurposing', 'efficiency'] },
  { title: 'High-Ticket Offer Design Workshop', description: 'Create and sell premium offers at $5k-$50k', category: 'Product', status: 'backlog', priority: 'high', tags: ['high-ticket', 'premium', 'offer-design'] },
  { title: 'Traffic Stacking Strategy Session', description: 'Combine organic and paid traffic for exponential growth', category: 'Marketing', status: 'backlog', priority: 'medium', tags: ['traffic', 'ads', 'organic'] },
  { title: 'AI Video Avatar Workshop', description: 'Create unlimited video content with AI avatars', category: 'Content', status: 'backlog', priority: 'low', tags: ['ai', 'video', 'avatar'] }
];

async function populateIdeas() {
  console.log('Adding ideas to board...\n');
  
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
  
  console.log('\n✅ Done! Check https://nicelycontrol.com/ideas');
}

populateIdeas();
