import React, { useState, useEffect } from "react";
import Head from "next/head";
import NavigationSidebar from "../components/NavigationSidebar";
import withAuth from "../lib/withAuth";
import { useAuth } from "../lib/authContext";

const PLATFORM_ICONS = {
  instagram: "📸",
  youtube: "📺",
  tiktok: "🎵",
  x: "🐦",
  bluesky: "🦋",
  linkedin: "💼",
};

const PLATFORM_SPECS = {
  instagram: {
    ratio: "1:1 or 4:5",
    size: "1080×1080 / 1080×1350",
    maxChars: 2200,
    hashtagLimit: 30,
    videoMax: "60s (Reels: 90s)",
    note: "First 125 chars visible before 'more'",
    color: "from-pink-500 to-orange-400",
  },
  youtube: {
    ratio: "16:9",
    size: "1280×720 min",
    maxChars: 5000,
    hashtagLimit: 15,
    videoMax: "15 min (unverified)",
    note: "First 157 chars show in search results",
    color: "from-red-600 to-red-400",
  },
  tiktok: {
    ratio: "9:16",
    size: "1080×1920",
    maxChars: 2200,
    hashtagLimit: 10,
    videoMax: "10 min",
    note: "Hook in first 3 seconds is critical",
    color: "from-pink-400 to-cyan-400",
  },
  x: {
    ratio: "16:9 or 1:1",
    size: "1200×675 / 1200×1200",
    maxChars: 280,
    hashtagLimit: 2,
    videoMax: "2m 20s",
    note: "Keep under 280 characters",
    color: "from-gray-700 to-gray-500",
  },
  bluesky: {
    ratio: "16:9 or 1:1",
    size: "1200×675",
    maxChars: 300,
    hashtagLimit: 5,
    videoMax: "60s",
    note: "300 character limit",
    color: "from-blue-500 to-cyan-400",
  },
  linkedin: {
    ratio: "1:1 or 1.91:1",
    size: "1200×1200 / 1200×628",
    maxChars: 3000,
    hashtagLimit: 5,
    videoMax: "10 min",
    note: "First 140 chars visible in feed",
    color: "from-blue-700 to-blue-500",
  },
};

const STATUS_COLORS = {
  pending: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "Pending" },
  approved: { bg: "bg-green-500/20", text: "text-green-400", label: "Approved" },
  scheduled: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Scheduled" },
  published: { bg: "bg-purple-500/20", text: "text-purple-400", label: "Published" },
  rejected: { bg: "bg-red-500/20", text: "text-red-400", label: "Rejected" },
};

function SocialPosts() {
  const { session } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    description: "",
    image_url: "",
    caption: "",
    platforms: [],
    format: "image",
  });

  const fetchPosts = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/social-posts${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, [session, filter]);

  const updatePost = async (id, action, updates = {}) => {
    try {
      const res = await fetch("/api/social-posts", {
        method: "PUT",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...updates }),
      });
      const data = await res.json();
      setPosts(posts.map(p => p.id === id ? data : p));
      if (selectedPost?.id === id) setSelectedPost(data);
    } catch (e) { console.error(e); }
  };

  const deletePost = async (id) => {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/social-posts?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setPosts(posts.filter(p => p.id !== id));
    if (selectedPost?.id === id) setSelectedPost(null);
  };

  const createPost = async () => {
    if (!newPost.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/social-posts", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });
      const data = await res.json();
      if (data.id) {
        setPosts([data, ...posts]);
        setShowAddModal(false);
        setNewPost({ title: "", description: "", image_url: "", caption: "", platforms: [], format: "image" });
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const togglePlatform = (platform) => {
    setNewPost(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const stats = {
    total: posts.length,
    pending: posts.filter(p => p.status === "pending").length,
    approved: posts.filter(p => p.status === "approved").length,
    published: posts.filter(p => p.status === "published").length,
  };

  return (
    <>
      <Head><title>Social Posts | NicelyControl</title></Head>
      <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
        <NavigationSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Social Posts</h1>
              <p className="text-gray-400 text-sm mt-1">Manage and approve posts for all platforms</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
              + New Post
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total", value: stats.total, color: "text-white" },
              { label: "Pending", value: stats.pending, color: "text-yellow-400" },
              { label: "Approved", value: stats.approved, color: "text-green-400" },
              { label: "Published", value: stats.published, color: "text-purple-400" },
            ].map(s => (
              <div key={s.label} className="bg-[#111] border border-gray-800 rounded-xl p-4">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-gray-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-800">
            {["all", "pending", "approved", "scheduled", "published", "rejected"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-semibold border-b-2 capitalize transition-colors ${filter === f ? "border-orange-500 text-orange-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Posts Grid */}
          {loading ? (
            <div className="text-gray-500 text-center py-12">Loading...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">📲</div>
              <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
              <p className="text-gray-400 mb-6">Create your first social post or run /vizard to generate clips</p>
              <button onClick={() => setShowAddModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Create Post
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {posts.map(post => {
                const statusStyle = STATUS_COLORS[post.status] || STATUS_COLORS.pending;
                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden cursor-pointer hover:border-gray-600 transition-all hover:scale-[1.02]"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-square bg-[#1a1a1a]">
                      {post.image_url || post.video_url ? (
                        <img
                          src={post.image_url || post.video_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div className="w-full h-full flex items-center justify-center text-4xl" style={{ display: post.image_url || post.video_url ? 'none' : 'flex' }}>
                        {post.format === 'video' ? '🎬' : post.format === 'carousel' ? '🖼️' : '📸'}
                      </div>
                      {/* Status badge */}
                      <div className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </div>
                      {/* Viral score */}
                      {post.viral_score && (
                        <div className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full bg-black/70 text-yellow-400 font-bold">
                          🔥 {post.viral_score}
                        </div>
                      )}
                      {/* Platform icons */}
                      {post.platforms?.length > 0 && (
                        <div className="absolute bottom-2 left-2 flex gap-1">
                          {post.platforms.slice(0, 4).map(p => (
                            <span key={p} className="text-sm bg-black/70 rounded px-1">{PLATFORM_ICONS[p] || "📱"}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-white text-sm line-clamp-1">{post.title}</h3>
                      {post.description && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{post.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setSelectedPost(null); }}>
          <PostModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onUpdate={updatePost}
            onDelete={deletePost}
          />
        </div>
      )}

      {/* Add Post Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-gray-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">New Social Post</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Title *" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
              <input type="text" placeholder="Description" value={newPost.description} onChange={e => setNewPost({...newPost, description: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
              <input type="text" placeholder="Image URL" value={newPost.image_url} onChange={e => setNewPost({...newPost, image_url: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
              <textarea placeholder="Caption" value={newPost.caption} onChange={e => setNewPost({...newPost, caption: e.target.value})} rows={3}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 resize-none" />
              {/* Format */}
              <div>
                <p className="text-gray-400 text-xs mb-2">Format</p>
                <div className="flex gap-2">
                  {["image", "video", "text", "carousel"].map(f => (
                    <button key={f} onClick={() => setNewPost({...newPost, format: f})}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${newPost.format === f ? "bg-orange-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              {/* Platforms */}
              <div>
                <p className="text-gray-400 text-xs mb-2">Platforms</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PLATFORM_ICONS).map(([platform, icon]) => (
                    <button key={platform} onClick={() => togglePlatform(platform)}
                      className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${newPost.platforms.includes(platform) ? "bg-orange-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                      {icon} {platform}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors">Cancel</button>
              <button onClick={createPost} disabled={saving || !newPost.title.trim()}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                {saving ? "Creating..." : "Create Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PostModal({ post, onClose, onUpdate, onDelete }) {
  const [activeTab, setActiveTab] = useState(post.platforms?.[0] || "instagram");
  const platforms = post.platforms?.length > 0 ? post.platforms : Object.keys(PLATFORM_ICONS);
  const spec = PLATFORM_SPECS[activeTab] || {};
  const caption = post.platform_captions?.[activeTab] || post.caption || "";
  const charCount = caption.length;
  const overLimit = charCount > (spec.maxChars || 9999);
  const statusStyle = STATUS_COLORS[post.status] || STATUS_COLORS.pending;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#111] border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white line-clamp-1">{post.title}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle.bg} ${statusStyle.text}`}>{statusStyle.label}</span>
            {post.viral_score && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold">🔥 {post.viral_score}</span>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none flex-shrink-0">×</button>
        </div>

        {/* Platform Tabs */}
        <div className="flex gap-1 px-5 pt-4 border-b border-gray-800 overflow-x-auto">
          {platforms.map(p => (
            <button
              key={p}
              onClick={() => setActiveTab(p)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors border-b-2 ${
                activeTab === p
                  ? "border-orange-500 text-white bg-orange-500/10"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <span>{PLATFORM_ICONS[p]}</span>
              <span className="capitalize">{p === "x" ? "X (Twitter)" : p}</span>
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Platform Specs Banner */}
          {spec.ratio && (
            <div className={`bg-gradient-to-r ${spec.color || "from-gray-700 to-gray-600"} rounded-xl p-4 mb-5`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{PLATFORM_ICONS[activeTab]}</span>
                  <div>
                    <p className="text-white font-bold capitalize">{activeTab === "x" ? "X (Twitter)" : activeTab}</p>
                    <p className="text-white/70 text-xs">{spec.note}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-right">
                  <div>
                    <p className="text-white/60 text-xs">Ratio</p>
                    <p className="text-white font-semibold text-sm">{spec.ratio}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Size</p>
                    <p className="text-white font-semibold text-sm">{spec.size}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Video Max</p>
                    <p className="text-white font-semibold text-sm">{spec.videoMax}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Hashtags</p>
                    <p className="text-white font-semibold text-sm">Max {spec.hashtagLimit}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Image Preview */}
          {post.image_url && (
            <div className="mb-5 rounded-xl overflow-hidden bg-[#1a1a1a] max-w-xs mx-auto" style={{
              aspectRatio: activeTab === "tiktok" ? "9/16" : activeTab === "youtube" ? "16/9" : "1/1",
              maxHeight: "300px"
            }}>
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Caption for this platform */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Caption for {activeTab === "x" ? "X (Twitter)" : activeTab}</p>
              <span className={`text-xs font-mono ${overLimit ? "text-red-400" : charCount > spec.maxChars * 0.8 ? "text-yellow-400" : "text-gray-500"}`}>
                {charCount} / {spec.maxChars}
              </span>
            </div>
            <div className={`bg-[#1a1a1a] rounded-xl p-4 text-gray-200 text-sm whitespace-pre-wrap border ${overLimit ? "border-red-500/50" : "border-gray-800"}`}>
              {caption || <span className="text-gray-600 italic">No caption for this platform yet</span>}
            </div>
            {overLimit && (
              <p className="text-red-400 text-xs mt-1">⚠️ Caption exceeds {spec.maxChars} character limit for {activeTab}</p>
            )}
          </div>

          {/* Source */}
          {post.source && (
            <p className="text-gray-600 text-xs mb-5">Source: {post.source}</p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-gray-800">
            {post.status === "pending" && (
              <>
                <button onClick={() => onUpdate(post.id, "approve")} className="flex-1 py-2.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 font-semibold text-sm transition-colors">
                  ✅ Approve
                </button>
                <button onClick={() => onUpdate(post.id, "reject")} className="py-2.5 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-sm transition-colors">
                  ✕ Reject
                </button>
              </>
            )}
            {post.status === "approved" && (
              <button onClick={() => onUpdate(post.id, "publish")} className="flex-1 py-2.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 font-semibold text-sm transition-colors">
                🚀 Send to Post Stream
              </button>
            )}
            {post.status === "rejected" && (
              <button onClick={() => onUpdate(post.id, "approve")} className="flex-1 py-2.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 font-semibold text-sm transition-colors">
                ↩️ Re-approve
              </button>
            )}
            <button onClick={() => onDelete(post.id)} className="py-2.5 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm transition-colors">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(SocialPosts);
