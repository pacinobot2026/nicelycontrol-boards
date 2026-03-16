import { useState, useEffect } from "react";
import Head from "next/head";
import NavigationSidebar from "../components/NavigationSidebar";
import withAuth from "../lib/withAuth";
import { useAuth } from "../lib/authContext";


const CATEGORIES = ["business", "email", "content", "links", "contacts", "system"];
const GROUPS = ["titanium", "resources", "external"];

const categoryColors = {
  business: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  email: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  content: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  links: "bg-green-500/20 text-green-400 border-green-500/30",
  contacts: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  system: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const categoryLabels = {
  business: "🚀 Business",
  email: "📧 Email",
  content: "🎓 Content",
  links: "🔗 Links & Pages",
  contacts: "👤 Contacts",
  system: "⚙️ System",
};

const groupLabels = {
  titanium: "⚡ Titanium",
  resources: "📚 Resources",
  external: "🔌 External Software",
};

const EMPTY_FORM = {
  name: "",
  category: "system",
  command_group: "resources",
  description: "",
  steps: "",
  shortcut: "",
  logo: "",
  sort_order: 999,
};

function CommandsPage() {
  const { session } = useAuth();
  const [commands, setCommands] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCommand, setExpandedCommand] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCommand, setEditingCommand] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const authHeaders = session?.access_token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }
    : { "Content-Type": "application/json" };

  useEffect(() => {
    if (!session?.access_token) return;
    fetch("/api/commands", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => r.json())
      .then((data) => { setCommands(Array.isArray(data) ? data : []); })
      .catch(() => {});
  }, [session]);

  const openAdd = () => {
    setEditingCommand(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (e, cmd) => {
    e.stopPropagation();
    setEditingCommand(cmd);
    setForm({
      name: cmd.name || "",
      category: cmd.category || "system",
      command_group: cmd.command_group || "resources",
      description: cmd.description || "",
      steps: Array.isArray(cmd.steps) ? cmd.steps.join("\n") : (cmd.steps || ""),
      shortcut: cmd.shortcut || "",
      logo: cmd.logo || "",
      sort_order: cmd.sort_order ?? 999,
    });
    setShowModal(true);
  };

  const handleDelete = async (e, cmd) => {
    e.stopPropagation();
    if (!cmd.id) return;
    if (!confirm(`Delete "${cmd.name}"?`)) return;
    const res = await fetch(`/api/commands?id=${cmd.id}`, { method: "DELETE", headers: authHeaders });
    if (res.ok) setCommands((prev) => prev.filter((c) => c.id !== cmd.id));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      steps: form.steps.split("\n").map((s) => s.trim()).filter(Boolean),
      sort_order: Number(form.sort_order) || 999,
    };

    try {
      if (editingCommand?.id) {
        const res = await fetch("/api/commands", {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({ id: editingCommand.id, ...payload }),
        });
        const updated = await res.json();
        setCommands((prev) => prev.map((c) => (c.id === editingCommand.id ? updated : c)));
      } else {
        const res = await fetch("/api/commands", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
        const created = await res.json();
        setCommands((prev) => [...prev, created]);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredCommands = commands.filter((cmd) => {
    const matchesGroup = selectedGroup === "all" || cmd.command_group === selectedGroup;
    const matchesSearch =
      cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const groups = ["all", "titanium", "resources", "external"];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Head>
        <title>Command Center</title>
      </Head>
      <NavigationSidebar />
      <div className="flex-1 text-white p-4 md:p-8 md:pt-8 pt-16 overflow-hidden relative">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl 2xl:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                🎬 Command Center
              </h1>
              <p className="text-gray-400 mt-2">Quick reference for all Pacino shortcodes and workflows</p>
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={openAdd}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span>+</span> Add Command
              </button>
              <a href="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
                ← Back to Dashboard
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(groupLabels).map(([key, label]) => {
              const count = commands.filter((c) => c.command_group === key).length;
              return (
                <div key={key} className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              );
            })}
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-400">{commands.length}</div>
              <div className="text-xs text-gray-400">Total Commands</div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search commands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            <div className="flex gap-2 flex-wrap">
              {groups.map((grp) => (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    selectedGroup === grp ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {grp === "all" ? "All" : groupLabels[grp]}
                </button>
              ))}
            </div>
          </div>

          {/* Commands Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommands.map((cmd) => (
              <div
                key={cmd.id || cmd.name}
                className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all cursor-pointer relative"
                onClick={() => setExpandedCommand(expandedCommand === (cmd.id || cmd.name) ? null : (cmd.id || cmd.name))}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <code className="text-lg font-bold text-blue-400">{cmd.name}</code>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs border ${categoryColors[cmd.category]}`}>
                        {categoryLabels[cmd.category]}
                      </span>
                      {cmd.id && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => openEdit(e, cmd)}
                            className="p-1 text-gray-500 hover:text-blue-400 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, cmd)}
                            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-3">{cmd.description}</p>

                  {cmd.logo && (
                    <div className="absolute bottom-4 right-4 group">
                      <img src={cmd.logo} alt="" className="w-5 h-5" />
                    </div>
                  )}

                  {cmd.shortcut && (
                    <div className="text-xs text-gray-500 mb-3">💡 {cmd.shortcut}</div>
                  )}

                  {expandedCommand === (cmd.id || cmd.name) && Array.isArray(cmd.steps) && cmd.steps.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <p className="text-xs text-gray-500 mb-2">Workflow Steps:</p>
                      <ol className="space-y-2">
                        {cmd.steps.map((step, i) => (
                          <li key={i} className="text-sm text-gray-400 flex gap-2">
                            <span className="text-blue-500 font-mono">{i + 1}.</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-gray-500">
                    {expandedCommand === (cmd.id || cmd.name) ? "Click to collapse ↑" : "Click to expand ↓"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCommands.length === 0 && (
            <div className="text-center py-12 text-gray-500">No commands found matching your search.</div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg border border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {editingCommand ? "Edit Command" : "Add Command"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="/mycommand"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{categoryLabels[c] || c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Group</label>
                  <select
                    value={form.command_group}
                    onChange={(e) => setForm({ ...form, command_group: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    {GROUPS.map((g) => (
                      <option key={g} value={g}>{groupLabels[g] || g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Steps (one per line)</label>
                <textarea
                  value={form.steps}
                  onChange={(e) => setForm({ ...form, steps: e.target.value })}
                  rows={5}
                  placeholder={"Step 1\nStep 2\nStep 3"}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Shortcut (optional)</label>
                <input
                  type="text"
                  value={form.shortcut}
                  onChange={(e) => setForm({ ...form, shortcut: e.target.value })}
                  placeholder='Type "/mycommand" to start'
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

            </div>

            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.description.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : editingCommand ? "Save Changes" : "Create Command"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(CommandsPage);
