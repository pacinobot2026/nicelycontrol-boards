import React, { useState, useEffect } from "react";
import Head from "next/head";
import NavigationSidebar from "../components/NavigationSidebar";
import withAuth from "../lib/withAuth";
import { useAuth } from "../lib/authContext";
import { getCache, setCache } from "../lib/cache";

function Ideas() {
  const { session } = useAuth();
  const [allIdeas, setAllIdeas] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [stats, setStats] = useState({});
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState("urgent");
  const [category, setCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIdea, setNewIdea] = useState({
    title: "",
    description: "",
    category: "business",
    priority: "medium",
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);
  const [viewMode, setViewMode] = useState("cards");

  useEffect(() => {
    loadIdeas();
  }, []);

  useEffect(() => {
    applyFilters(allIdeas);
  }, [allIdeas, filter, category, sortBy]);

  async function loadIdeas() {
    // Check cache first
    const cached = getCache('ideas');
    if (cached) {
      setAllIdeas(cached.ideas || []);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // Fetch fresh data
    try {
      const res = await fetch("/api/ideas", {
        
      });
      const data = await res.json();
      setAllIdeas(data.ideas || []);
      setCache('ideas', { ideas: data.ideas || [] });
    } catch (err) {
      console.error("Failed to load ideas:", err);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters(source) {
    let filtered = source;
    
    // If category is selected, ignore status filter - show all in that category
    if (category !== "all") {
      filtered = filtered.filter((i) => i.category === category);
    } else {
      // Only apply status filter when showing all categories
      filtered = filtered.filter((i) => i.status === filter);
    }

    if (sortBy === "date_desc")
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sortBy === "date_asc")
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else if (sortBy === "title")
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "priority") {
      const order = { high: 3, medium: 2, low: 1 };
      filtered.sort((a, b) => order[b.priority] - order[a.priority]);
    }

    const statsCalc = {
      urgent: source.filter((i) => i.status === "urgent").length,
      active: source.filter((i) => i.status === "active").length,
      someday: source.filter((i) => i.status === "someday").length,
      completed: source.filter((i) => i.status === "completed").length,
    };

    const categoryMap = {};
    source.forEach((i) => {
      if (!categoryMap[i.category]) categoryMap[i.category] = 0;
      categoryMap[i.category]++;
    });

    setIdeas(filtered);
    setStats(statsCalc);
    setCategories(
      Object.keys(categoryMap).map((name) => ({
        name,
        count: categoryMap[name],
      })),
    );
  }

  const filteredIdeas = ideas.filter(
    (idea) =>
      searchTerm === "" ||
      idea.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  async function handleUpdateIdea() {
    if (!editingIdea.title.trim()) return;
    try {
      const res = await fetch("/api/ideas", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(editingIdea),
      });
      if (res.ok) {
        setShowEditModal(false);
        setEditingIdea(null);
        await loadIdeas();
      }
    } catch (err) {
      console.error("Failed to update idea:", err);
    }
  }

  async function handleDeleteIdea(id) {
    if (!confirm("Delete this idea?")) return;
    try {
      const res = await fetch("/api/ideas", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) await loadIdeas();
    } catch (err) {
      console.error("Failed to delete idea:", err);
    }
  }

  async function handleAddIdea() {
    if (!newIdea.title.trim()) return;
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...newIdea, status: filter }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewIdea({
          title: "",
          description: "",
          category: "business",
          priority: "medium",
        });
        await loadIdeas();
      }
    } catch (err) {
      console.error("Failed to add idea:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Head>
          <title>Idea Board</title>
        </Head>
        <NavigationSidebar />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Loading ideas...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Head>
        <title>Idea Board</title>
      </Head>
      <NavigationSidebar />
      <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center gap-3">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
                💡 Idea Board
              </h1>
              <p className="text-sm text-gray-400">
                Capture and organize your ideas
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 md:px-6 py-3 bg-purple-600 rounded-lg text-white text-sm font-semibold cursor-pointer hover:scale-105 transition-transform border-none whitespace-nowrap flex-shrink-0"
            >
              + New Idea
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
            {[
              { icon: "🔥", label: "Urgent", key: "urgent" },
              { icon: "⚡", label: "Active", key: "active" },
              { icon: "💭", label: "Someday", key: "someday" },
              { icon: "✅", label: "Done", key: "completed" },
            ].map(({ icon, label, key }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`p-3 md:p-4 rounded-xl border cursor-pointer transition-all text-left ${filter === key ? "bg-purple-600 border-purple-600 scale-105" : "bg-gray-800/50 border-gray-600/50 hover:bg-gray-800"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <div
                      className={`text-2xl font-bold leading-none mb-1 ${filter === key ? "text-white" : "text-cyan-400"}`}
                    >
                      {stats[key] || 0}
                    </div>
                    <div
                      className={`text-xs ${filter === key ? "text-white/70" : "text-gray-500"}`}
                    >
                      {label}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {["all", ...categories.map((c) => c.name)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${category === cat ? "bg-purple-600 border-purple-600 text-white" : "bg-gray-800/50 border-gray-600/50 text-white hover:bg-gray-800"}`}
                >
                  {cat === "all"
                    ? "All Categories"
                    : `${cat} (${categories.find((c) => c.name === cat)?.count})`}
                </button>
              ))}
            </div>
          )}

          {/* Search + Sort + View Toggle */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              placeholder="🔍 Search ideas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-gray-800/50 border border-gray-600/50 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500"
            />
            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 sm:flex-none bg-gray-800/50 border border-gray-600/50 rounded-lg px-4 py-2.5 text-white text-sm cursor-pointer outline-none"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="title">Title</option>
                <option value="priority">Priority</option>
              </select>
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
          </div>

          {/* Ideas Grid/List */}
          <div className="glass-card rounded-2xl p-4 md:p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-white">💡 Ideas</h2>
              <span className="text-sm text-gray-400">
                {filteredIdeas.length}{" "}
                {filteredIdeas.length === 1 ? "idea" : "ideas"}
              </span>
            </div>

            {filteredIdeas.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                {searchTerm
                  ? `No ideas matching "${searchTerm}"`
                  : `No ideas in ${filter}`}
              </div>
            ) : viewMode === "list" ? (
              <div className="flex flex-col gap-3">
                {filteredIdeas.map((idea) => (
                  <IdeaCardList
                    key={idea.id}
                    idea={idea}
                    onEdit={() => {
                      setEditingIdea({ ...idea });
                      setShowEditModal(true);
                    }}
                    onDelete={() => handleDeleteIdea(idea.id)}
                  />
                ))}
              </div>
            ) : (
              <div
                className="grid gap-5"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                }}
              >
                {filteredIdeas.map((idea) => (
                  <IdeaCardGrid
                    key={idea.id}
                    idea={idea}
                    onEdit={() => {
                      setEditingIdea({ ...idea });
                      setShowEditModal(true);
                    }}
                    onDelete={() => handleDeleteIdea(idea.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Idea Modal */}
      {showEditModal && editingIdea && (
        <div
          className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-5"
          onClick={() => {
            setShowEditModal(false);
            setEditingIdea(null);
          }}
        >
          <div
            className="bg-gray-800 rounded-t-2xl sm:rounded-2xl border border-gray-600/50 max-w-xl w-full p-5 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-6">✏️ Edit Idea</h2>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Idea title..."
                value={editingIdea.title}
                onChange={(e) =>
                  setEditingIdea({ ...editingIdea, title: e.target.value })
                }
                className="bg-gray-700/70 border border-gray-600/50 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-purple-500"
              />
              <textarea
                placeholder="Description..."
                value={editingIdea.description || ""}
                onChange={(e) =>
                  setEditingIdea({
                    ...editingIdea,
                    description: e.target.value,
                  })
                }
                rows={4}
                className="bg-gray-700/70 border border-gray-600/50 rounded-lg px-4 py-3 text-white text-sm outline-none resize-y focus:border-purple-500"
              />
              <div className="flex gap-3">
                <select
                  value={editingIdea.priority}
                  onChange={(e) =>
                    setEditingIdea({ ...editingIdea, priority: e.target.value })
                  }
                  className="flex-1 bg-gray-700/70 border border-gray-600/50 rounded-lg px-4 py-3 text-white text-sm outline-none cursor-pointer"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <select
                  value={editingIdea.status}
                  onChange={(e) =>
                    setEditingIdea({ ...editingIdea, status: e.target.value })
                  }
                  className="flex-1 bg-gray-700/70 border border-gray-600/50 rounded-lg px-4 py-3 text-white text-sm outline-none cursor-pointer"
                >
                  <option value="urgent">Urgent</option>
                  <option value="active">Active</option>
                  <option value="someday">Someday</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateIdea}
                  className="flex-1 py-3 bg-purple-600 border-none rounded-lg text-white text-sm font-semibold cursor-pointer hover:bg-purple-500 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingIdea(null);
                  }}
                  className="flex-1 py-3 bg-gray-700/70 border border-gray-600/50 rounded-lg text-gray-400 text-sm font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Idea Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-5"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-gray-800 rounded-t-2xl sm:rounded-2xl border border-gray-600/50 max-w-xl w-full p-5 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-6">💡 New Idea</h2>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Idea title..."
                value={newIdea.title}
                onChange={(e) =>
                  setNewIdea({ ...newIdea, title: e.target.value })
                }
                className="bg-gray-700/70 border border-gray-600/50 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-purple-500"
              />
              <textarea
                placeholder="Description..."
                value={newIdea.description}
                onChange={(e) =>
                  setNewIdea({ ...newIdea, description: e.target.value })
                }
                rows={4}
                className="bg-gray-700/70 border border-gray-600/50 rounded-lg px-4 py-3 text-white text-sm outline-none resize-y focus:border-purple-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleAddIdea}
                  className="flex-1 py-3 bg-purple-600 border-none rounded-lg text-white text-sm font-semibold cursor-pointer hover:bg-purple-500 transition-colors"
                >
                  Save Idea
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-gray-700/70 border border-gray-600/50 rounded-lg text-gray-400 text-sm font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const priorityHeaderClass = {
  high: "bg-gradient-to-br from-red-500 to-red-600",
  medium: "bg-gradient-to-br from-yellow-500 to-yellow-600",
  low: "bg-gradient-to-br from-green-500 to-green-600",
};

const priorityBadgeClass = {
  high: "bg-red-400/10 text-red-400",
  medium: "bg-yellow-400/10 text-yellow-400",
  low: "bg-green-400/10 text-green-400",
};

const priorityIcon = {
  high: "🔥",
  medium: "⚡",
  low: "💭",
};

function IdeaCardList({ idea, onEdit, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="bg-gray-800/70 rounded-lg border border-gray-600/50 px-4 py-3 cursor-pointer hover:border-purple-500/50 hover:bg-gray-800/90 transition-all"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <h3 className="text-white text-sm font-medium flex-1 min-w-0">
          {idea.title}
        </h3>
        <div className="flex gap-2 items-center">
          <span
            className={`px-2 py-0.5 rounded text-xs font-semibold ${priorityBadgeClass[idea.priority]}`}
          >
            {idea.priority}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(idea.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 4px",
              color: "#9ca3af",
              fontSize: "13px",
            }}
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 4px",
              color: "#9ca3af",
              fontSize: "13px",
            }}
            title="Delete"
          >
            🗑
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-600/30 text-gray-400 text-sm leading-relaxed">
          {idea.description}
          {idea.tags && idea.tags.length > 0 && (
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {idea.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 bg-blue-400/15 rounded text-xs text-blue-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IdeaCardGrid({ idea, onEdit, onDelete }) {
  return (
    <div className="bg-gray-800/70 rounded-xl border border-gray-600/50 overflow-hidden transition-all hover:border-purple-500/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-900/20">
      <div
        className={`flex items-center justify-center min-h-20 ${priorityHeaderClass[idea.priority] || "bg-gray-700"}`}
      >
        <span className="text-5xl">{priorityIcon[idea.priority] || "💡"}</span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-white text-sm font-semibold leading-snug">
            {idea.title}
          </h3>
          <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
            <button
              onClick={onEdit}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 4px",
                color: "#9ca3af",
                fontSize: "13px",
              }}
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={onDelete}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 4px",
                color: "#9ca3af",
                fontSize: "13px",
              }}
              title="Delete"
            >
              🗑
            </button>
          </div>
        </div>
        <p className="text-gray-400 text-xs mb-3 leading-relaxed line-clamp-2">
          {idea.description}
        </p>
        <div className="flex gap-2 flex-wrap mb-3">
          {idea.category && (
            <span className="px-2 py-1 bg-gray-900 rounded text-xs text-gray-400">
              {idea.category}
            </span>
          )}
          <span className="px-2 py-1 bg-gray-900 rounded text-xs text-gray-400">
            {new Date(idea.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        {idea.tags && idea.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {idea.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-purple-900/30 border border-purple-700/40 rounded text-xs text-purple-300"
              >
                {tag}
              </span>
            ))}
            {idea.tags.length > 3 && (
              <span className="text-xs text-gray-500 py-0.5">
                +{idea.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Ideas;
