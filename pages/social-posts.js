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
          <div className="bg-[#111] border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">{selectedPost.title}</h2>
              <button onClick={() => setSelectedPost(null)} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="p-5">
              {/* Image/Video Preview */}
              {(selectedPost.image_url || selectedPost.video_url) && (
                <div className="mb-5 rounded-xl overflow-hidden bg-[#1a1a1a] aspect-square max-w-sm mx-auto">
                  {selectedPost.video_url ? (
                    <video src={selectedPost.video_url} controls className="w-full h-full object-contain" />
                  ) : (
                    <img src={selectedPost.image_url} alt={selectedPost.title} className="w-full h-full object-contain" />
                  )}
                </div>
              )}

              {/* Status + Viral Score */}
              <div className="flex items-center gap-3 mb-4">
                {(() => { const s = STATUS_COLORS[selectedPost.status] || STATUS_COLORS.pending; return (
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${s.bg} ${s.text}`}>{s.label}</span>
                ); })()}
                {selectedPost.viral_score && (
                  <span className="text-sm px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 font-bold">🔥 Viral Score: {selectedPost.viral_score}</span>
                )}
                <span className="text-sm px-3 py-1 rounded-full bg-gray-800 text-gray-400 capitalize">{selectedPost.format}</span>
              </div>

              {/* Platforms */}
              {selectedPost.platforms?.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Platforms</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedPost.platforms.map(p => (
                      <span key={p} className="flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-gray-800 text-gray-300 capitalize">
                        {PLATFORM_ICONS[p]} {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Caption */}
              {selectedPost.caption && (
                <div className="mb-4">
                  <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Caption</p>
                  <div className="bg-[#1a1a1a] rounded-xl p-4 text-gray-200 text-sm whitespace-pre-wrap">{selectedPost.caption}</div>
                </div>
              )}

              {/* Platform-specific captions */}
              {selectedPost.platform_captions && Object.keys(selectedPost.platform_captions).length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Platform Captions</p>
                  <div className="space-y-2">
                    {Object.entries(selectedPost.platform_captions).map(([platform, caption]) => (
                      <div key={platform} className="bg-[#1a1a1a] rounded-xl p-3">
                        <p className="text-orange-400 text-xs font-semibold mb-1 capitalize">{PLATFORM_ICONS[platform]} {platform}</p>
                        <p className="text-gray-300 text-sm">{caption}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedPost.description && (
                <div className="mb-4">
                  <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Description</p>
                  <p className="text-gray-300 text-sm">{selectedPost.description}</p>
                </div>
              )}

              {/* Source */}
              {selectedPost.source && (
                <div className="mb-5">
                  <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Source</p>
                  <p className="text-gray-500 text-xs">{selectedPost.source}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-800">
                {selectedPost.status === "pending" && (
                  <>
                    <button onClick={() => updatePost(selectedPost.id, "approve")} className="flex-1 py-2.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 font-semibold text-sm transition-colors">
                      ✅ Approve
                    </button>
                    <button onClick={() => updatePost(selectedPost.id, "reject")} className="py-2.5 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-sm transition-colors">
                      ✕ Reject
                    </button>
                  </>
                )}
                {selectedPost.status === "approved" && (
                  <button onClick={() => updatePost(selectedPost.id, "publish")} className="flex-1 py-2.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 font-semibold text-sm transition-colors">
                    🚀 Send to Post Stream
                  </button>
                )}
                <button onClick={() => deletePost(selectedPost.id)} className="py-2.5 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm transition-colors">
                  🗑️
                </button>
              </div>
            </div>
          </div>
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

export default withAuth(SocialPosts);
