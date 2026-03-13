import { supabase } from "../../../lib/supabase";

const LETTERMAN_BASE = "https://api.letterman.ai/api/ai/newsletters-storage";

// In-memory cache
let cache = {
  data: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutes
};

function getCachedArticles() {
  const now = Date.now();
  if (cache.data && now - cache.timestamp < cache.ttl) {
    return cache.data;
  }
  return null;
}

function setCachedArticles(articles) {
  cache.data = articles;
  cache.timestamp = Date.now();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const LETTERMAN_API_KEY =
    req.headers.authorization?.replace("Bearer ", "") || null;
  if (!LETTERMAN_API_KEY) {
    return res
      .status(400)
      .json({ error: "Letterman API key not configured", noKey: true });
  }

  // Allow force refresh via query parameter
  const forceRefresh = req.query.refresh === "true";
  const syncFromLetterman = req.query.sync === "true" || forceRefresh;

  // If not syncing, return from Supabase
  // if (!syncFromLetterman) {
  //   try {
  //     const { data: articles, error } = await supabase
  //       .from("articles")
  //       .select("*")
  //       .order("created_at", { ascending: false });

  //     if (error) throw error;

  //     return res.status(200).json({
  //       articles: articles || [],
  //       total: articles?.length || 0,
  //       source: "database",
  //     });
  //   } catch (error) {
  //     console.error("Error fetching from Supabase:", error.message);
  //     // Fall through to sync from Letterman if DB read fails
  //   }
  // }

  // Sync from Letterman
  const headers = { Authorization: `Bearer ${LETTERMAN_API_KEY}` };

  try {
    // Step 1: Fetch all publications dynamically
    const pubsRes = await fetch(LETTERMAN_BASE, {
      headers,
      signal: AbortSignal.timeout(10000),
    });
    const publications = await pubsRes.json();

    if (!Array.isArray(publications)) {
      return res.status(400).json({
        error: "Invalid Letterman API key or unexpected response",
        noKey: true,
      });
    }

    // Step 2: Fetch articles for each publication
    var allArticles = [];

    for (const pub of publications) {
      const pubId = pub._id;
      const pubName = pub.name || "Unknown";
      try {
        const response = await fetch(`${LETTERMAN_BASE}/${pubId}/newsletters`, {
          headers,
          signal: AbortSignal.timeout(10000),
        });
        const data = await response.json();
        const newsletters = data || [];

        const articlesToAdd = (
          Array.isArray(newsletters) ? newsletters : []
        ).map((article) => ({
          id: article._id,
          title: article.name || article.title || "Untitled",
          publication: pubName,
          publication_id: pubId,
          status: article.state || "draft",
          image_url:
            article.previewImageUrl || article.archiveThumbnailImageUrl || null,
          seo_title: article.name || article.title || null,
          seo_description: article.description || null,
          url_path: article.urlPath || null,
          content: null, // Can be populated later
          created_at: article.createdAt || new Date().toISOString(),
          updated_at: article.updatedAt || new Date().toISOString(),
          letterman_data: article,
        }));

        allArticles.push(...articlesToAdd);

        // Store in Supabase (upsert to avoid duplicates)
        if (articlesToAdd.length > 0) {
          const { error: upsertError } = await supabase
            .from("articles")
            .upsert(articlesToAdd, { onConflict: "id" });

          if (upsertError) {
            console.error(
              `Error upserting articles for "${pubName}":`,
              upsertError.message,
            );
          }
        }
      } catch (err) {
        console.error(
          `Error fetching articles for publication "${pubName}":`,
          err.message,
        );
      }
    }

    // Cache the results
    setCachedArticles(allArticles);

    return res.status(200).json({
      articles: allArticles,
      total: allArticles.length,
      source: "letterman",
      synced: true,
    });
  } catch (error) {
    console.error("Error fetching articles:", error.message);
    return res.status(500).json({ error: "Failed to fetch articles" });
  }
}
