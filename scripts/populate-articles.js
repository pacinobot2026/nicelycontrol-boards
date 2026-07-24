const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split(/\r?\n/).forEach(line => {
  // Skip comments and empty lines
  if (line.trim().startsWith('#') || !line.trim()) return;
  
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // Remove quotes if present
    value = value.replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

console.log('Loaded env vars:', Object.keys(envVars));
console.log('LETTERMAN_API_KEY present:', !!envVars.LETTERMAN_API_KEY);

const supabaseUrl = envVars.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const lettermanKey = envVars.LETTERMAN_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!lettermanKey) {
  console.error('Missing LETTERMAN_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateArticles() {
  console.log('🚀 Starting article sync from Letterman...\n');

  try {
    // Fetch publications from Letterman
    const pubsRes = await fetch('https://api.letterman.ai/publications', {
      headers: { Authorization: `Bearer ${lettermanKey}` },
    });

    const pubsData = await pubsRes.json();
    const publications = pubsData?.publications;

    if (!Array.isArray(publications)) {
      console.error('❌ Invalid Letterman API response');
      process.exit(1);
    }

    console.log(`📚 Found ${publications.length} publications\n`);

    let totalArticles = 0;

    // Fetch articles for each publication
    for (const pub of publications) {
      const pubId = pub.id;
      const pubName = pub.name || 'Unknown';

      console.log(`📖 Fetching articles from "${pubName}"...`);

      try {
        const response = await fetch(
          `https://api.letterman.ai/newsletters?storageId=${pubId}`,
          { headers: { Authorization: `Bearer ${lettermanKey}` } }
        );

        const newslettersData = await response.json();
        const newsletters = newslettersData?.newsletters;

        if (!Array.isArray(newsletters)) {
          console.log(`   ⚠️  No articles found\n`);
          continue;
        }

        console.log(`   Found ${newsletters.length} articles`);

        // Prepare articles for Supabase
        const articles = newsletters.map(article => ({
          id: article.id,
          title: article.title || article.subject || 'Untitled',
          publication: pubName,
          publication_id: pubId,
          status: article.state || 'draft',
          image_url: article.previewImageUrl || article.archiveThumbnailImageUrl || null,
          seo_title: article.title || article.subject || null,
          seo_description: article.description || null,
          url_path: article.urlPath || null,
          content: null,
          created_at: article.createdAt || new Date().toISOString(),
          updated_at: article.createdAt || new Date().toISOString(),
          letterman_data: article,
        }));

        // Upsert to Supabase
        const { data, error } = await supabase
          .from('articles')
          .upsert(articles, { onConflict: 'id' });

        if (error) {
          console.error(`   ❌ Error upserting: ${error.message}\n`);
          continue;
        }

        console.log(`   ✅ Synced ${articles.length} articles\n`);
        totalArticles += articles.length;

      } catch (err) {
        console.error(`   ❌ Error: ${err.message}\n`);
      }
    }

    console.log(`\n🎉 Sync complete! Total articles: ${totalArticles}`);

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

populateArticles();
