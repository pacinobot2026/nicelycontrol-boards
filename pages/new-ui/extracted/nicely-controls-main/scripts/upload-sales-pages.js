const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jqqvqdjxviqnsgpxcgfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcXZxZGp4dmlxbnNncHhjZ2ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk2MjIwOSwiZXhwIjoyMDg3NTM4MjA5fQ.ibJyHrxx2TlfRbfh-9IKD3-kY9aSXAfrDJ1ZHVFijOQ';

const supabase = createClient(supabaseUrl, supabaseKey);

const salesPages = [
  { title: 'Key Elements Diagram', url: 'https://files.catbox.moe/05oe8o.jpg', notes: 'Clean visual breakdown of sales page structure - 7 core elements' },
  { title: 'EasyWebinar - Amy Porterfield', url: 'https://files.catbox.moe/tokvpu.jpg', notes: 'Partnership offer, celebrity endorsement, $71/month annual billing' },
  { title: 'CopyHackers - Seasonal Sales', url: 'https://files.catbox.moe/uekgan.jpg', notes: 'Black Friday campaign copy course with video CTA' },
  { title: 'Digital Marketer - E-Commerce Cert', url: 'https://files.catbox.moe/a6cruf.jpg', notes: 'Certification with badge, countdown timer, social proof - $295 (was $1,209)' },
  { title: 'Digital Marketer - LinkedIn Workshop', url: 'https://files.catbox.moe/o3hq86.jpg', notes: 'Problem-focused headline, 760M stat, $295 price point' },
  { title: 'RainMaker AI - Course Creation', url: 'https://files.catbox.moe/bki9ah.jpg', notes: 'AI course creation, countdown timer, black background design' },
  { title: 'Golden Era Physique System', url: 'https://files.catbox.moe/2jyvn7.jpg', notes: 'Fitness program, bold claims (200-300% more muscle), gold/black premium feel' },
  { title: 'Jordan Peterson - Personality Course', url: 'https://files.catbox.moe/l82xus.jpg', notes: 'Celebrity authority, 120k+ students, $99 (was $149), dark sophisticated design' },
  { title: 'Keap Academy Workshop', url: 'https://files.catbox.moe/djg4g7.jpg', notes: 'Live event, bright blue background, countdown timer, 2-day format' },
  { title: 'Full Focus - Burnout to Balance', url: 'https://files.catbox.moe/tv6bor.jpg', notes: 'Free training, elegant serif typography, lifestyle imagery, Michael Hyatt' },
  { title: 'Mindvalley - Unlimited Abundance', url: 'https://files.catbox.moe/t4bkqo.jpg', notes: 'Membership subscription, $1/day model, 50+ programs, Christie Marie Sheldon' },
  { title: 'Launch Formula - 6 & 7-Figure', url: 'https://files.catbox.moe/6lny89.jpg', notes: 'Social proof banner, 1000+ students, battle-tested system, turquoise accent' },
  { title: 'Selena Soo - Publicity Services', url: 'https://files.catbox.moe/ksmyan.jpg', notes: 'Service page, clean professional design, media logos, VIP coaching' },
  { title: 'Smile Direct Club - Aligners', url: 'https://files.catbox.moe/ldn56z.jpg', notes: 'Physical product, half the cost of braces, Trustpilot widget, purple brand' },
  { title: '4 Week Shred - Fat Loss', url: 'https://files.catbox.moe/1dr6ci.jpg', notes: 'Fitness program, dramatic imagery, bold claims, high-contrast design' },
  { title: 'Tiny Offer - Digital Products', url: 'https://files.catbox.moe/eveect.jpg', notes: '$47 course, stats-based social proof (26k+ products sold, $4.2M sales)' },
  { title: 'Flux Academy - Web Design', url: 'https://files.catbox.moe/3jyoap.jpg', notes: 'Bold purple typography, 2,184 students, instructor Ran Segall, minimal clean design' },
  { title: 'Yogalates London - Online Classes', url: 'https://files.catbox.moe/vzknwy.jpg', notes: 'Live online classes, serif elegance, seasonal offer, teal brand color' }
];

async function uploadToVault() {
  console.log('Starting upload of 18 sales pages...\n');
  
  for (const page of salesPages) {
    try {
      const { data, error } = await supabase
        .from('vault_items')
        .insert([{
          title: page.title,
          category: 'Sales Pages',
          type: 'Screenshot',
          resource_url: page.url,
          notes: page.notes,
          tags: ['sales-page', 'reference', 'design']
        }])
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed: ${page.title}`);
        console.error(error.message);
      } else {
        console.log(`✅ Added: ${page.title}`);
      }
    } catch (err) {
      console.error(`❌ Error on ${page.title}:`, err.message);
    }
  }
  
  console.log('\n✅ Upload complete! Check https://nicelycontrol.com/vault');
}

uploadToVault();
