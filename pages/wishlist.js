import { useState, useEffect } from "react";
import Head from "next/head";
import NavigationSidebar from "../components/NavigationSidebar";
import withAuth from "../lib/withAuth";
import { useAuth } from "../lib/authContext";
import { getCache, setCache } from "../lib/cache";

const EMPTY_FORM = {
  title: "",
  url: "",
  description: "",
  category: "",
  status: "to-buy",
  price: "",
  image: "",
  tags: "",
};

function Wishlist() {
  const { session } = useAuth();
  const [allShopping, setAllShopping] = useState([]);
  const [shopping, setShopping] = useState([]);
  const [stats, setStats] = useState({});
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState("to-buy");
  const [category, setCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'add' } | { mode: 'edit', item }
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    if (session) loadShopping();
  }, [session]);
  useEffect(() => {
    applyFilters(allShopping);
  }, [allShopping, filter, category, sortBy]);

  async function loadShopping() {
    // Check cache first
    const cached = getCache('shopping');
    if (cached) {
      setAllShopping(cached.items || []);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // Fetch fresh data
    try {
      const res = await fetch("/api/shopping", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setAllShopping(data.items || []);
      setCache('shopping', { items: data.items || [] });
    } catch (err) {
      console.error("Failed to load shopping items:", err);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters(source) {
    let filtered = source.filter((b) => b.status === filter);
    if (category !== "all")
      filtered = filtered.filter((b) => b.category === category);
    if (sortBy === "date_desc")
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sortBy === "date_asc")
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else if (sortBy === "title")
      filtered.sort((a, b) => a.title.localeCompare(b.title));

    const statsCalc = {
      "to-buy": source.filter((b) => b.status === "to-buy").length,
      watching: source.filter((b) => b.status === "watching").length,
      archived: source.filter((b) => b.status === "archived").length,
    };
    const categoryMap = {};
    source.forEach((b) => {
      if (b.category) {
        categoryMap[b.category] = (categoryMap[b.category] || 0) + 1;
      }
    });

    setShopping(filtered);
    setStats(statsCalc);
    setCategories(
      Object.keys(categoryMap).map((name) => ({
        name,
        count: categoryMap[name],
      })),
    );
    setLoading(false);
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setModal({ mode: "add" });
  }

  function openEdit(item) {
    setForm({
      title: item.title,
      url: item.url || "",
      description: item.description || "",
      category: item.category || "",
      status: item.status,
      price: item.price || "",
      image: item.image || "",
      tags: (item.tags || []).join(", "),
    });
    setModal({ mode: "edit", item });
  }

  async function saveItem() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      const isEdit = modal.mode === "edit";
      const res = await fetch("/api/shopping", {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(
          isEdit ? { id: modal.item.id, ...payload } : payload,
        ),
      });
      if (res.ok) {
        setModal(null);
        loadShopping();
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id) {
    await fetch("/api/shopping", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ id }),
    });
    setDeleteId(null);
    loadShopping();
  }

  const filteredShopping = shopping.filter(
    (item) =>
      searchTerm === "" ||
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Head>
          <title>Wish List</title>
        </Head>
        <NavigationSidebar />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Loading items...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Head>
        <title>Wish List</title>
      </Head>
      <NavigationSidebar />
      <main className="flex-1 p-8 pt-16 md:pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
                🛒 Wishlist
              </h1>
              <p className="text-sm text-gray-400">
                Track things to buy or watch
              </p>
            </div>
            <div className="flex justify-end mt-3">
              <button
                onClick={openAdd}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                + Add Item
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {[
              { icon: "🛍️", label: "To Buy", key: "to-buy" },
              { icon: "👀", label: "Watching", key: "watching" },
              { icon: "📦", label: "Archived", key: "archived" },
            ].map(({ icon, label, key }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`p-4 rounded-xl border cursor-pointer transition-all text-left ${filter === key ? "bg-purple-600 border-purple-600 scale-105" : "bg-gray-800/50 border-gray-600/50 hover:bg-gray-800"}`}
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

          {/* Search + Sort */}
          <div className="flex gap-3 flex-wrap mb-6">
            <input
              type="text"
              placeholder="🔍 Search items..."
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
          </div>

          {/* Grid */}
          <div className="glass-card rounded-2xl p-6">
            {filteredShopping.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                {searchTerm
                  ? `No items matching "${searchTerm}"`
                  : `No ${filter} items`}
              </div>
            ) : (
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                }}
              >
                {filteredShopping.map((item) => (
                  <ShoppingCard
                    key={item.id}
                    item={item}
                    onEdit={() => openEdit(item)}
                    onDelete={() => setDeleteId(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 text-right text-sm text-gray-400">
            {filteredShopping.length}{" "}
            {filteredShopping.length === 1 ? "item" : "items"}
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {modal.mode === "add" ? "Add Item" : "Edit Item"}
            </h2>
            <div className="flex flex-col gap-3">
              <input
                placeholder="Title *"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500"
              />
              <input
                placeholder="URL"
                value={form.url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, url: e.target.value }))
                }
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500"
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500 resize-none"
              />
              <input
                placeholder="Category"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500"
              />
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500"
              >
                <option value="to-buy">To Buy</option>
                <option value="watching">Watching</option>
                <option value="archived">Archived</option>
              </select>
              <input
                placeholder="Price (e.g. $29.99)"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500"
              />
              <input
                placeholder="Image URL (optional)"
                value={form.image}
                onChange={(e) =>
                  setForm((f) => ({ ...f, image: e.target.value }))
                }
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500"
              />
              <input
                placeholder="Tags (comma separated)"
                value={form.tags}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tags: e.target.value }))
                }
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveItem}
                disabled={saving || !form.title.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-white mb-2">Delete Item?</h2>
            <p className="text-gray-400 text-sm mb-5">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteItem(deleteId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShoppingCard({ item, onEdit, onDelete }) {
  return (
    <div className="group bg-gray-800/70 rounded-xl border border-gray-600/50 p-4 transition-all hover:border-purple-500/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-900/20">
      {item.image && (
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-48 object-cover rounded-lg mb-3"
        />
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:text-blue-400 text-base font-semibold block no-underline leading-snug transition-colors"
        >
          {item.title}
        </a>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors text-xs"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors text-xs"
          >
            🗑️
          </button>
        </div>
      </div>
      <p className="text-gray-400 text-sm mb-3 leading-relaxed">
        {item.description}
      </p>
      <div className="flex gap-2 flex-wrap mb-3 items-center">
        {item.price && (
          <span className="px-2 py-1 bg-green-700 rounded text-xs font-semibold text-white">
            {item.price}
          </span>
        )}
        {item.category && (
          <span className="px-2 py-1 bg-gray-900 rounded text-xs text-gray-400">
            {item.category}
          </span>
        )}
        <span className="px-2 py-1 bg-gray-900 rounded text-xs text-gray-400">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {(item.tags || []).map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 bg-purple-900/30 border border-purple-700/40 rounded text-xs text-purple-300"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default withAuth(Wishlist);
