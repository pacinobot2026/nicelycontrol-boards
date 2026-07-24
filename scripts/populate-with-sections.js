const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split(/\r?\n/).forEach(line => {
  if (line.trim().startsWith('#') || !line.trim()) return;
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    value = value.replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const lettermanKey = envVars.LETTERMAN_API_KEY;

if (!supabaseUrl || !supabaseKey || !lettermanKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateWithSections() {
  console.log('🚀 Fetching articles with titles...\n');

  try {
    // Fetch publications
    const pubsRes = await fetch('https://api.letterman.ai/publications', {
      headers: { Authorization: `Bearer ${lettermanKey}` },
    });
    const pubsData = await pubsRes.json();
    const publications = pubsData?.publications;

    console.log(`📚 Found ${publications.length} publications\n`);

    let totalArticles = 0;

    for (const pub of publications) {
      const pubId = pub.id;
      const pubName = pub.name || 'Unknown';

      console.log(`📖 Processing "${pubName}"...`);

      try {
        const response = await fetch(
          `https://api.letterman.ai/newsletters?storageId=${pubId}`,
          { headers: { Authorization: `Bearer ${lettermanKey}` } }
        );

        const data = await response.json();
        const newsletters = data?.newsletters;
        if (!Array.isArray(newsletters) || newsletters.length === 0) {
          console.log(`   ⚠️  No articles found\n`);
          continue;
        }

        console.log(`   Found ${newsletters.length} articles`);

        const articles = [];

        for (const article of newsletters) {
          const articleTitle = article.title || article.subject || pubName;

          articles.push({
            id: article.id,
            title: articleTitle,
            publication: pubName,
            publication_id: pubId,
            status: article.state || 'draft',
            image_url: article.previewImageUrl || article.archiveThumbnailImageUrl || null,
            seo_title: articleTitle,
            seo_description: article.description || null,
            url_path: article.urlPath || null,
            content: null,
            created_at: article.createdAt || new Date().toISOString(),
            updated_at: article.createdAt || new Date().toISOString(),
            letterman_data: article,
          });
        }

        // Upsert to Supabase
        if (articles.length > 0) {
          const { error } = await supabase
            .from('articles')
            .upsert(articles, { onConflict: 'id' });

          if (error) {
            console.error(`   ❌ Error: ${error.message}\n`);
          } else {
            console.log(`   ✅ Synced ${articles.length} articles with titles\n`);
            totalArticles += articles.length;
          }
        }

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

populateWithSections();
