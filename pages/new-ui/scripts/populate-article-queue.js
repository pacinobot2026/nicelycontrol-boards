const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jqqvqdjxviqnsgpxcgfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcXZxZGp4dmlxbnNncHhjZ2ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk2MjIwOSwiZXhwIjoyMDg3NTM4MjA5fQ.ibJyHrxx2TlfRbfh-9IKD3-kY9aSXAfrDJ1ZHVFijOQ';

const supabase = createClient(supabaseUrl, supabaseKey);

const articles = [
  {
    number: 1,
    title: "Lunar New Year Parade in Summerlin",
    headline: "Summerlin Celebrates Lunar New Year with Festive Parade Honoring Asian Heritage",
    type: "EVENTS",
    priority: "HIGH",
    status: "pending",
    word_count: 350,
    key_points: "Parade in Downtown Summerlin area, Honors Southern Nevada's Asian community, Cultural performances, food, decorations, Family-friendly celebration",
    angle: "Celebrate local diversity, community coming together, great photo ops for families",
    sources: "KLAS 8 News Now coverage",
    publication: "West Valley Shoutouts"
  },
  {
    number: 2,
    title: "Valentine's Day Events Guide",
    headline: "Last-Minute Valentine's Day Plans: West Valley's Best Romantic Spots",
    type: "EVENTS",
    priority: "HIGH",
    status: "pending",
    word_count: 400,
    key_points: "Romantic restaurants in area, Events and activities for couples, Budget-friendly date ideas, Family Valentine's activities",
    angle: "Help locals find last-minute plans, focus on west valley spots",
    publication: "West Valley Shoutouts"
  },
  {
    number: 3,
    title: "$18.9M Olympic Pool at Pavilion Center",
    headline: "Summerlin Scores Splashy $18.9 Million Olympic Pool at Pavilion Center",
    type: "COMMUNITY",
    priority: "MEDIUM",
    status: "pending",
    word_count: 350,
    key_points: "Major investment in community amenities, Olympic-sized pool coming to Pavilion Center, Benefits for local families, Timeline and features",
    angle: "Exciting addition for residents, shows Summerlin's continued growth",
    sources: "Hoodline coverage",
    publication: "West Valley Shoutouts"
  },
  {
    number: 4,
    title: "Chinatown Area New Retail Center",
    headline: "Las Vegas' Chinatown Area to Welcome New Retail Center",
    type: "BUSINESS",
    priority: "MEDIUM",
    status: "pending",
    word_count: 300,
    key_points: "New retail development in Spring Mountain corridor, More shopping/dining options for west valley, Part of area's continued growth",
    angle: "Positive development news for local community",
    sources: "Las Vegas Review-Journal",
    publication: "West Valley Shoutouts"
  },
  {
    number: 5,
    title: "Locals Casinos Thriving",
    headline: "Nevada Locals Casinos Thrive as Strip Visitation Declines in 2025",
    type: "BUSINESS",
    priority: "MEDIUM",
    status: "pending",
    word_count: 350,
    key_points: "Station Casinos seeing growth, Why locals prefer neighborhood casinos, Better deals and convenience, Impact on west valley economy",
    angle: "Good news for local economy, spotlight on neighborhood gaming",
    publication: "West Valley Shoutouts"
  },
  {
    number: 6,
    title: "Cougar Spotted Near Property",
    headline: "Southern Nevada Family Concerned After Cougar Spotted Prowling Property",
    type: "WILDLIFE",
    priority: "MEDIUM",
    status: "pending",
    word_count: 300,
    key_points: "Mountain lion activity near residential areas, Tips for staying safe, When to report sightings, Nevada Wildlife response",
    angle: "Safety awareness without fear-mongering",
    sources: "FOX5 Vegas",
    publication: "West Valley Shoutouts"
  },
  {
    number: 7,
    title: "Hospital Loses Mammography Accreditation",
    headline: "Las Vegas Hospital Loses Mammography Accreditation After Quality Issues Found",
    type: "HEALTH",
    priority: "LOW",
    status: "pending",
    word_count: 400,
    key_points: "Quality issues identified, What this means for patients, Alternative screening locations, Importance of regular screening",
    angle: "Informative, help readers find alternatives",
    publication: "West Valley Shoutouts"
  },
  {
    number: 8,
    title: "Traffic Safety Awareness",
    headline: "West Valley Traffic Safety: What You Need to Know",
    type: "NEWS",
    priority: "LOW",
    status: "pending",
    word_count: 300,
    key_points: "Dangerous intersections, Safe driving tips, Speed enforcement updates, Community traffic improvements",
    angle: "Constructive safety message",
    publication: "West Valley Shoutouts"
  },
  {
    number: 9,
    title: "Best Parks in West Valley",
    headline: "Hidden Gems: The Best Parks in Las Vegas's West Valley",
    type: "COMMUNITY",
    priority: "LOW",
    status: "pending",
    word_count: 400,
    key_points: "Top 5-7 parks in the area, What makes each special, Amenities and activities, Kid-friendly features",
    angle: "Helpful evergreen resource for families",
    publication: "West Valley Shoutouts"
  },
  {
    number: 10,
    title: "New Restaurants & Businesses",
    headline: "What's New: Recent Business Openings in West Valley",
    type: "BUSINESS",
    priority: "LOW",
    status: "pending",
    word_count: 350,
    key_points: "Recent restaurant/store openings, Brief intro to each, Addresses and hours, What to try first",
    angle: "Community resource for discovering new spots",
    publication: "West Valley Shoutouts"
  }
];

async function populateArticleQueue() {
  console.log('Populating Article Queue from West Valley Shoutouts content-queue...\n');
  
  for (const article of articles) {
    try {
      const { data, error } = await supabase
        .from('article_queue')
        .insert([article])
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed: #${article.number} - ${article.title}`);
        console.error(error.message);
      } else {
        console.log(`✅ Added: #${article.number} - ${article.title} [${article.priority}]`);
      }
    } catch (err) {
      console.error(`❌ Error on #${article.number}:`, err.message);
    }
  }
  
  console.log('\n✅ Done! Article queue populated with 10 story ideas.');
  console.log('View at: https://www.nicelycontrol.com/articles');
}

populateArticleQueue();
