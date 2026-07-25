const { getSupabaseClient } = require('../../scripts/lib/supabase-env');


const supabase = getSupabaseClient();

const articles = [
  {
    title: "#1 - Lunar New Year Parade in Summerlin 🎆",
    description: "Summerlin Celebrates Lunar New Year with Festive Parade Honoring Asian Heritage. Parade in Downtown Summerlin area, Honors Southern Nevada's Asian community, Cultural performances, food, decorations. [HIGH PRIORITY - EVENTS - 350 words]",
    url: "https://www.8newsnow.com",
    publication: "West Valley Shoutouts",
    status: "pending"
  },
  {
    title: "#2 - Valentine's Day Events Guide ❤️",
    description: "Last-Minute Valentine's Day Plans: West Valley's Best Romantic Spots. Romantic restaurants in area, Events and activities for couples, Budget-friendly date ideas. [HIGH PRIORITY - EVENTS - 400 words]",
    url: "https://news.google.com",
    publication: "West Valley Shoutouts",
    status: "pending"
  },
  {
    title: "#3 - $18.9M Olympic Pool at Pavilion Center 🏊",
    description: "Summerlin Scores Splashy $18.9 Million Olympic Pool at Pavilion Center. Major investment in community amenities, Olympic-sized pool coming to Pavilion Center, Benefits for local families. [MEDIUM - COMMUNITY - 350 words]",
    url: "https://hoodline.com",
    publication: "West Valley Shoutouts",
    status: "pending"
  },
  {
    title: "#4 - Chinatown Area New Retail Center 🏬",
    description: "Las Vegas' Chinatown Area to Welcome New Retail Center. New retail development in Spring Mountain corridor, More shopping/dining options for west valley. [MEDIUM - BUSINESS - 300 words]",
    url: "https://reviewjournal.com",
    publication: "West Valley Shoutouts",
    status: "pending"
  },
  {
    title: "#5 - Locals Casinos Thriving 🎰",
    description: "Nevada Locals Casinos Thrive as Strip Visitation Declines in 2025. Station Casinos seeing growth, Why locals prefer neighborhood casinos, Impact on west valley economy. [MEDIUM - BUSINESS - 350 words]",
    url: "https://news.google.com",
    publication: "West Valley Shoutouts",
    status: "pending"
  },
  {
    title: "#6 - Cougar Spotted Near Property 🐆",
    description: "Southern Nevada Family Concerned After Cougar Spotted Prowling Property. Mountain lion activity near residential areas, Tips for staying safe, When to report sightings. [MEDIUM - WILDLIFE - 300 words]",
    url: "https://fox5vegas.com",
    publication: "West Valley Shoutouts",
    status: "pending"
  },
  {
    title: "#7 - Hospital Loses Mammography Accreditation ⚠️",
    description: "Las Vegas Hospital Loses Mammography Accreditation After Quality Issues Found. What this means for patients, Alternative screening locations, Importance of regular screening. [LOW - HEALTH - 400 words]",
    url: "https://news.google.com",
    publication: "West Valley Shoutouts",
    status: "pending"
  },
  {
    title: "#8 - Traffic Safety Awareness 🚨",
    description: "West Valley Traffic Safety: What You Need to Know. Dangerous intersections, Safe driving tips, Speed enforcement updates, Community traffic improvements. [LOW - NEWS - 300 words]",
    url: "https://news.google.com",
    publication: "West Valley Shoutouts",
    status: "pending"
  },
  {
    title: "#9 - Best Parks in West Valley 🏞️",
    description: "Hidden Gems: The Best Parks in Las Vegas's West Valley. Top 5-7 parks in the area, What makes each special, Amenities and activities, Kid-friendly features. [LOW - COMMUNITY - 400 words]",
    url: "https://news.google.com",
    publication: "West Valley Shoutouts",
    status: "pending"
  },
  {
    title: "#10 - New Restaurants & Businesses 🍽️",
    description: "What's New: Recent Business Openings in West Valley. Recent restaurant/store openings, Brief intro to each, Addresses and hours, What to try first. [LOW - BUSINESS - 350 words]",
    url: "https://news.google.com",
    publication: "West Valley Shoutouts",
    status: "pending"
  }
];

async function loadQueue() {
  console.log('Loading West Valley Shoutouts content queue...\n');
  
  const userId = '08dee908-d31b-4c19-ae7d-227ccbb068cf';
  
  for (const article of articles) {
    try {
      const { data, error} = await supabase
        .from('article_ideas')
        .insert([{ ...article, user_id: userId }])
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed: ${article.title}`);
        console.error(error.message);
      } else {
        console.log(`✅ Added: ${article.title}`);
      }
    } catch (err) {
      console.error(`❌ Error:`, err.message);
    }
  }
  
  console.log('\n✅ Done! 10 story ideas loaded into Articles board.');
  console.log('View at: https://www.nicelycontrol.com/articles');
}

loadQueue();
