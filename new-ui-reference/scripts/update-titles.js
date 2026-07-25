const { getSupabaseClient } = require('../../scripts/lib/supabase-env');

const supabase = getSupabaseClient();

async function updateTitles() {
  console.log('📝 Updating article titles...\n');

  const { data: articles } = await supabase
    .from('articles')
    .select('id, publication, created_at');

  let count = 0;

  for (const article of articles) {
    const date = new Date(article.created_at);
    const title = `${article.publication} - ${date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })}`;

    await supabase
      .from('articles')
      .update({ title, seo_title: title })
      .eq('id', article.id);

    count++;
    if (count % 10 === 0) {
      console.log(`   Updated ${count}/${articles.length}...`);
    }
  }

  console.log(`\n✅ Updated ${count} article titles!`);
}

updateTitles();
