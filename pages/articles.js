import { useState, useEffect } from "react";
import Head from "next/head";
import NavigationSidebar from "../components/NavigationSidebar";
import withAuth from "../lib/withAuth";
import { useAuth } from "../lib/authContext";
import { getCache, setCache } from "../lib/cache";

function Articles() {
  const { session } = useAuth();
  const [allArticles, setAllArticles] = useState([]);
  const [publications, setPublications] = useState([]);
  const [publication, setPublication] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [viewMode, setViewMode] = useState("cards");
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchCountdown, setSearchCountdown] = useState(3600);
  const [postCountdown, setPostCountdown] = useState(7200);

  // Letterman API key management
  const [hasKey, setHasKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [apiError, setApiError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (session) {
      loadArticles(); // loadArticles is the sole authority on hasKey
      loadSettings(); // only pre-fills keyInput panel, does NOT affect hasKey
    }
  }, [session]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSearchCountdown((prev) => (prev > 0 ? prev - 1 : 3600));
      setPostCountdown((prev) => (prev > 0 ? prev - 1 : 7200));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function loadSettings() {
    // Only used to pre-fill the key input panel - does NOT control hasKey
    try {
      const res = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      console.log(session.access_token);
      const data = await res.json();
      if (data.settings?.letterman_api_key) {
        setKeyInput(""); // key exists, keep input blank (password masked anyway)
      }
    } catch {
      // ignore
    }
  }

  async function saveKey() {
    if (!keyInput.trim()) return;
    setSavingKey(true);
    setKeyError("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          key: "letterman_api_key",
          value: keyInput.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      setHasKey(true);
      setShowKeyInput(false);
      setKeyInput("");
      loadArticles();
    } catch {
      setKeyError("Failed to save key. Please try again.");
    } finally {
      setSavingKey(false);
    }
  }

  async function refreshArticles() {
    setRefreshing(true);
    setApiError("");
    try {
      const res = await fetch("/api/articles?refresh=true", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();

      if (data.noKey) {
        setHasKey(false);
        return;
      }

      if (!res.ok) {
        setApiError(data.error || `API error (${res.status})`);
        return;
      }

      setHasKey(true);
      const fetched = data.articles || [];
      setAllArticles(fetched);

      // Update cache
      setCache('articles', { articles: fetched });

      const pubMap = {};
      fetched.forEach((a) => {
        if (a.publication) {
          if (!pubMap[a.publication]) pubMap[a.publication] = 0;
          pubMap[a.publication]++;
        }
      });
      setPublications(
        Object.keys(pubMap).map((name) => ({ name, count: pubMap[name] })),
      );
    } catch (err) {
      console.error("Failed to refresh articles:", err);
      setApiError("Network error - could not reach the server.");
    } finally {
      setRefreshing(false);
    }
  }

  async function loadArticles() {
    // Check cache first
    const cached = getCache('articles');
    if (cached) {
      setAllArticles(cached.articles || []);
      const pubMap = {};
      (cached.articles || []).forEach((a) => {
        if (a.publication) {
          if (!pubMap[a.publication]) pubMap[a.publication] = 0;
          pubMap[a.publication]++;
        }
      });
      setPublications(
        Object.keys(pubMap).map((name) => ({ name, count: pubMap[name] })),
      );
      setHasKey(true);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // Fetch fresh data
    setApiError("");
    try {
      const res = await fetch("/api/articles", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();

      if (data.noKey) {
        setHasKey(false);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setApiError(data.error || `API error (${res.status})`);
        setLoading(false);
        return;
      }

      setHasKey(true);
      const fetched = data.articles || [];
      setAllArticles(fetched);

      // Update cache
      setCache('articles', { articles: fetched });

      const pubMap = {};
      fetched.forEach((a) => {
        if (a.publication) {
          if (!pubMap[a.publication]) pubMap[a.publication] = 0;
          pubMap[a.publication]++;
        }
      });
      setPublications(
        Object.keys(pubMap).map((name) => ({ name, count: pubMap[name] })),
      );
    } catch (err) {
      console.error("Failed to load articles:", err);
      if (!cached) {
        setApiError("Network error - could not reach the server.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Compute filtered articles directly - no intermediate state or useEffect needed
  let filteredArticles =
    publication === "all"
      ? allArticles
      : allArticles.filter((a) => a.publication === publication);
  if (sortBy === "date_desc")
    filteredArticles = [...filteredArticles].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
    );
  else if (sortBy === "date_asc")
    filteredArticles = [...filteredArticles].sort(
      (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0),
    );
  else if (sortBy === "title")
    filteredArticles = [...filteredArticles].sort((a, b) =>
      (a.title || "").localeCompare(b.title || ""),
    );
  if (searchTerm)
    filteredArticles = filteredArticles.filter((a) =>
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Head>
          <title>Article Cue</title>
        </Head>
        <NavigationSidebar />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Loading articles...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Head>
        <title>Article Cue</title>
      </Head>
      <NavigationSidebar />
      <main className="flex-1 p-8 pt-16 md:pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-start flex-wrap gap-3">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
                📰 Article Cue Board
              </h1>
              <p className="text-sm text-gray-400">
                Article review and publishing
              </p>
            </div>
            {/* API key status */}
            <div className="flex items-center gap-2">
              {hasKey ? (
                <>
                  <span className="text-xs text-green-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                    Letterman connected
                  </span>
                  <button
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer bg-transparent border-none"
                  >
                    Edit key
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowKeyInput(true)}
                  className="px-4 py-2 bg-yellow-500 text-black text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-yellow-400 transition-colors"
                >
                  + Connect Letterman API
                </button>
              )}
            </div>
          </div>

          {/* Letterman API key input panel */}
          {showKeyInput && (
            <div className="mb-6 bg-gray-800 border border-gray-600/50 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-1">
                Letterman API Key
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Paste your Letterman API key below. It will be saved securely
                and used to fetch your articles.
              </p>
              <div className="flex gap-3 flex-wrap">
                <input
                  type="password"
                  placeholder="Paste your Letterman API key..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveKey()}
                  className="flex-1 min-w-64 bg-gray-700/70 border border-gray-600/50 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-yellow-500"
                />
                <button
                  onClick={saveKey}
                  disabled={savingKey || !keyInput.trim()}
                  className="px-5 py-2.5 bg-yellow-500 text-black font-semibold rounded-lg border-none cursor-pointer hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {savingKey ? "Saving..." : "Save Key"}
                </button>
                <button
                  onClick={() => {
                    setShowKeyInput(false);
                    setKeyInput("");
                    setKeyError("");
                  }}
                  className="px-5 py-2.5 bg-gray-700 text-gray-400 font-semibold rounded-lg border-none cursor-pointer hover:text-white transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
              {keyError && (
                <p className="mt-2 text-sm text-red-400">{keyError}</p>
              )}
            </div>
          )}

          {/* No key configured - placeholder */}
          {!hasKey && !showKeyInput && (
            <div className="glass-card rounded-2xl p-16 text-center">
              <div className="text-5xl mb-4">🔑</div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Letterman API Key Required
              </h2>
              <p className="text-gray-400 mb-6 text-sm">
                Connect your Letterman account to start fetching articles.
              </p>
              <button
                onClick={() => setShowKeyInput(true)}
                className="px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg border-none cursor-pointer hover:bg-yellow-400 transition-colors"
              >
                + Connect Letterman API
              </button>
            </div>
          )}

          {/* Main content - only shown when key is configured */}
          {hasKey && (
            <>
              {/* API error banner */}
              {apiError && (
                <div className="mb-4 bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-400">
                  ⚠️ {apiError}
                </div>
              )}
              {/* Status Banner */}
              <div className="bg-gray-600/10 border border-gray-600/30 rounded-xl px-5 py-3 mb-4 flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">🔍</span>
                  <div>
                    <div className="text-sm font-semibold text-purple-400">
                      Next article search
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      In {formatTime(searchCountdown)} (automated)
                    </div>
                  </div>
                </div>
                <div className="w-px h-10 bg-gray-600/30" />
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">📰</span>
                  <div>
                    <div className="text-sm font-semibold text-blue-400">
                      Next Letterman post
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      In {formatTime(postCountdown)} (automated)
                    </div>
                  </div>
                </div>
              </div>

              {/* Publications Filter + View Toggle */}
              <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setPublication("all")}
                    className={`px-4 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${publication === "all" ? "bg-purple-600 border-purple-600 text-white" : "bg-gray-800/50 border-gray-600/50 text-white hover:bg-gray-800"}`}
                  >
                    All Publications
                  </button>
                  {publications.map((pub) => (
                    <button
                      key={pub.name}
                      onClick={() => setPublication(pub.name)}
                      className={`px-4 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${publication === pub.name ? "bg-purple-600 border-purple-600 text-white" : "bg-gray-800/50 border-gray-600/50 text-white hover:bg-gray-800"}`}
                    >
                      {pub.name} ({pub.count})
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 bg-gray-800/50 border border-gray-600/50 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold text-white cursor-pointer border-none transition-colors ${viewMode === "list" ? "bg-purple-600" : "bg-transparent"}`}
                  >
                    📋 List
                  </button>
                  <button
                    onClick={() => setViewMode("cards")}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold text-white cursor-pointer border-none transition-colors ${viewMode === "cards" ? "bg-purple-600" : "bg-transparent"}`}
                  >
                    🎴 Cards
                  </button>
                </div>
              </div>

              {/* Search + Sort + Refresh */}
              <div className="flex gap-3 flex-wrap mb-6">
                <input
                  type="text"
                  placeholder="🔍 Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 min-w-48 bg-gray-800/50 border border-gray-600/50 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-800/50 border border-gray-600/50 rounded-lg px-4 py-2.5 text-white text-sm cursor-pointer outline-none"
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="title">Title</option>
                </select>
                <button
                  onClick={refreshArticles}
                  disabled={refreshing}
                  className="px-5 py-2.5 bg-purple-600 border-none rounded-lg text-white text-sm font-semibold cursor-pointer hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <span className={refreshing ? "animate-spin" : ""}>🔄</span>
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {/* Articles */}
              {filteredArticles.length === 0 ? (
                <div className="glass-card rounded-2xl p-16 text-center text-gray-500">
                  {searchTerm
                    ? `No articles matching "${searchTerm}"`
                    : "No articles found"}
                </div>
              ) : viewMode === "list" ? (
                <div className="glass-card rounded-2xl overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-800/70 border-b border-gray-600/50">
                        <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 w-16" />
                        <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400">
                          TITLE
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 w-48">
                          PUBLICATION
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 w-36">
                          DATE
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArticles.map((article, index) => (
                        <ArticleRow
                          key={article._id || article.id || index}
                          article={article}
                          index={index}
                          onClick={() => setSelectedArticle(article)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-6">
                  <div
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(220px, 1fr))",
                    }}
                  >
                    {filteredArticles.map((article, index) => (
                      <ArticleCard
                        key={article._id || article.id || index}
                        article={article}
                        onClick={() => setSelectedArticle(article)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 text-right text-sm text-gray-400">
                {filteredArticles.length}{" "}
                {filteredArticles.length === 1 ? "article" : "articles"}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Article Modal */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}

function ArticleRow({ article, index, onClick }) {
  const date = article.created_at || article.createdAt;
  const imageUrl = article.image_url || article.image;

  return (
    <tr
      className={`border-b border-gray-600/30 hover:bg-purple-900/10 transition-colors cursor-pointer ${index % 2 === 0 ? "bg-gray-800/30" : ""}`}
      onClick={onClick}
    >
      <td className="px-5 py-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">
              📰
            </div>
          )}
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="text-white text-sm font-medium leading-snug hover:text-blue-400 transition-colors">
          {article.title || "Untitled"}
        </div>
      </td>
      <td className="px-5 py-3">
        {article.publication && (
          <span className="px-3 py-1 bg-purple-600 rounded text-xs font-semibold text-white">
            {article.publication}
          </span>
        )}
      </td>
      <td className="px-5 py-3 text-gray-400 text-sm">
        {date
          ? new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-"}
      </td>
    </tr>
  );
}

function ArticleCard({ article, onClick }) {
  const date = article.created_at || article.createdAt;
  const imageUrl = article.image_url || article.image;

  return (
    <div
      className="bg-gray-800/70 rounded-xl border border-gray-600/50 overflow-hidden cursor-pointer hover:border-purple-500/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-900/20 transition-all"
      onClick={onClick}
    >
      <div className="aspect-[4/5] bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden grayscale hover:grayscale-0 transition-all">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-white">
            📰
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-white text-sm font-semibold mb-2 leading-snug">
          {article.title || "Untitled"}
        </h3>
        <div className="flex gap-2 flex-wrap">
          {article.publication && (
            <span className="px-2 py-1 bg-gray-900 rounded text-xs text-gray-400">
              {article.publication}
            </span>
          )}
          {date && (
            <span className="px-2 py-1 bg-gray-900 rounded text-xs text-gray-400">
              {new Date(date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ArticleModal({ article, onClose }) {
  const date = article.created_at || article.createdAt;
  const imageUrl = article.image_url || article.image;

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-5"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-2xl border border-gray-600/50 max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-600/50 flex justify-between items-start gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-3 leading-snug">
              {article.title}
            </h2>
            <div className="flex gap-3 flex-wrap items-center">
              {article.publication && (
                <span className="px-3 py-1 bg-purple-600 rounded text-xs font-semibold text-white">
                  {article.publication}
                </span>
              )}
              {date && (
                <span className="text-sm text-gray-400">
                  {new Date(date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-2 bg-gray-700/70 border border-gray-600/50 rounded-lg text-gray-400 cursor-pointer hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div
          className="p-6 overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 160px)" }}
        >
          {imageUrl && (
            <div className="mb-6 rounded-xl overflow-hidden">
              <img
                src={imageUrl}
                alt={article.title}
                className="w-full h-auto block"
              />
            </div>
          )}
          <div className="text-base leading-relaxed text-gray-200">
            {article.content ||
              article.body ||
              article.description ||
              "No content available."}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(Articles);
