const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jqqvqdjxviqnsgpxcgfs.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcXZxZGp4dmlxbnNncHhjZ2ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk2MjIwOSwiZXhwIjoyMDg3NTM4MjA5fQ.ibJyHrxx2TlfRbfh-9IKD3-kY9aSXAfrDJ1ZHVFijOQ');

// Add published_date column
const updates = [
  {
    id: 'real-wv1',
    full_article: `LAS VEGAS (KTNV) — Metro police are working to reduce dangerous motorcycle crashes after eight of the valley's 24 traffic deaths this year involved motorcyclists, many without proper licenses.

Las Vegas Metro Police are teaming up with Red Rock Harley-Davidson this Saturday for a free, hands-on ride day aimed at helping new riders learn the basics of motorcycle safety.

You can catch the event on March 7 from 9 a.m. to 2 p.m. at 2260 South Rainbow Boulevard.

The partnership comes as the department responds to a troubling trend on valley roads.

"As temperatures rise, so does the number of motorcycles on our roads, every year we respond to crashes of drivers who lack licenses or proper training," LVMPD's Lieutenant Cody Fulwiler shared.`,
    source_date: 'March 7, 2026'
  },
  {
    id: 'real-fork1',
    full_article: `LAS VEGAS (KTNV) — Even though some tariffs have been paused or eased, many consumers are still seeing high prices and wondering why relief hasn't shown up yet.

At Pinches Tacos in Las Vegas, co-owner Javier Anaya says his restaurant is still trying to recover from rising costs. "We're still trying to catch up," Anaya said.

Earlier this year, the restaurant was forced to raise prices again. "We just recently raised the prices on January 1st again, not because we want to make a ton of money," Anaya explained. "We want to make sure that we're making enough money to pay the bills right now."

Even with some tariffs easing, Anaya says the math behind running a restaurant still adds up quickly. "For example, our Asada is between eight to eleven dollars a pound," he said. "When you break it down, that's almost two dollars just in meat for one taco. That's not counting your labor, rent, everything else."

Those costs can make it difficult for businesses to lower prices right away.

Local economist Jeremy Aguero says policy changes like tariff adjustments don't always translate immediately into lower prices for consumers. "The level of uncertainty that exists relative to how long they're going to exist… is making most businesses take a wait-and-see attitude," Aguero said.`,
    source_date: 'March 8, 2026'
  }
];

(async () => {
  for (const update of updates) {
    const { error } = await supabase
      .from('articles')
      .update({
        content: update.full_article,
        url_path: update.source_date
      })
      .eq('id', update.id);
    
    if (error) console.error('Error updating', update.id, ':', error.message);
    else console.log('✅ Updated', update.id);
  }
  
  console.log('\n✅ Done! Articles now have full content and dates.');
})();
