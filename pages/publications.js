import React, { useState, useEffect } from "react";
import Head from "next/head";
import NavigationSidebar from "../components/NavigationSidebar";
import withAuth from "../lib/withAuth";
import { useAuth } from "../lib/authContext";

function Publications() {
  const { session } = useAuth();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPub, setNewPub] = useState({
    name: "",
    description: "",
    city: "",
    state: "",
    letterman_id: "",
    letterman_url: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchPublications = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/publications", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setPublications(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPublications();
  }, [session]);

  const createPublication = async () => {
    if (!newPub.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/publications", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPub),
      });
      const data = await res.json();
      if (data.id) {
        setPublications([data, ...publications]);
        setShowAddModal(false);
        setNewPub({ name: "", description: "", city: "", state: "", letterman_id: "", letterman_url: "" });
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const deletePublication = async (id) => {
    if (!confirm("Delete this publication?")) return;
    await fetch(`/api/publications?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setPublications(publications.filter((p) => p.id !== id));
  };

  const toggleActive = async (pub) => {
    const res = await fetch("/api/publications", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: pub.id, active: !pub.active }),
    });
    const data = await res.json();
    setPublications(publications.map((p) => (p.id === pub.id ? data : p)));
  };

  return (
    <>
      <Head><title>Publications | NicelyControl</title></Head>
      <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
        <NavigationSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Publications</h1>
              <p className="text-gray-400 text-sm mt-1">Manage your local media newsletters and publications</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              + New Publication
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
              <div className="text-2xl font-bold text-orange-400">{publications.length}</div>
              <div className="text-gray-400 text-sm">Total Publications</div>
            </div>
            <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-400">{publications.filter(p => p.active).length}</div>
              <div className="text-gray-400 text-sm">Active</div>
            </div>
            <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-400">{publications.filter(p => p.letterman_id).length}</div>
              <div className="text-gray-400 text-sm">Letterman Connected</div>
            </div>
          </div>

          {/* Publications Grid */}
          {loading ? (
            <div className="text-gray-500 text-center py-12">Loading...</div>
          ) : publications.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">📰</div>
              <h3 className="text-xl font-semibold text-white mb-2">No publications yet</h3>
              <p className="text-gray-400 mb-6">Create your first local media publication</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Create Publication
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publications.map((pub) => (
                <div key={pub.id} className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {pub.logo_url ? (
                        <img src={pub.logo_url} alt={pub.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-400 font-bold text-lg">
                          {pub.name[0]}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-white">{pub.name}</h3>
                        {pub.city && <p className="text-gray-400 text-xs">{pub.city}{pub.state ? `, ${pub.state}` : ''}</p>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${pub.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                      {pub.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {pub.description && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{pub.description}</p>
                  )}

                  {pub.letterman_id && (
                    <div className="flex items-center gap-2 text-xs text-blue-400 mb-3">
                      <span>📨</span>
                      <span>Letterman connected</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
                    <button
                      onClick={() => toggleActive(pub)}
                      className="flex-1 text-xs py-1.5 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                      {pub.active ? 'Deactivate' : 'Activate'}
                    </button>
                    {pub.letterman_url && (
                      <a
                        href={pub.letterman_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs py-1.5 px-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                      >
                        Open
                      </a>
                    )}
                    <button
                      onClick={() => deletePublication(pub.id)}
                      className="text-xs py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">New Publication</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Publication name *"
                value={newPub.name}
                onChange={(e) => setNewPub({ ...newPub, name: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
              />
              <input
                type="text"
                placeholder="Description"
                value={newPub.description}
                onChange={(e) => setNewPub({ ...newPub, description: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={newPub.city}
                  onChange={(e) => setNewPub({ ...newPub, city: e.target.value })}
                  className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={newPub.state}
                  onChange={(e) => setNewPub({ ...newPub, state: e.target.value })}
                  className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <input
                type="text"
                placeholder="Letterman Publication ID"
                value={newPub.letterman_id}
                onChange={(e) => setNewPub({ ...newPub, letterman_id: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
              />
              <input
                type="text"
                placeholder="Letterman URL"
                value={newPub.letterman_url}
                onChange={(e) => setNewPub({ ...newPub, letterman_url: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createPublication}
                disabled={saving || !newPub.name.trim()}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {saving ? "Creating..." : "Create Publication"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default withAuth(Publications);
